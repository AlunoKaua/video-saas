from pathlib import Path
from tempfile import gettempdir
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from pytubefix import YouTube

import os
import re
import unicodedata

app = FastAPI(title="Video SaaS Downloader")

MAX_DURATION_SECONDS = 60 * 30
DOWNLOAD_DIR = Path(gettempdir()) / "video-saas-downloads"
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)


class VideoRequest(BaseModel):
    url: HttpUrl
    allowLongVideos: bool = False


def verify_internal_token(authorization: Optional[str]) -> None:
    expected = os.getenv("INTERNAL_API_TOKEN")
    if not expected:
        raise HTTPException(status_code=500, detail="INTERNAL_API_TOKEN not configured")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def load_video(url: str) -> YouTube:
    try:
        return YouTube(url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not load video") from exc


def video_metadata(video: YouTube) -> dict:
    try:
        return {
            "title": video.title,
            "author": video.author,
            "thumbnail": video.thumbnail_url,
            "durationSeconds": video.length,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read video metadata") from exc


def enforce_duration_limit(video: YouTube, allow_long_videos: bool) -> None:
    if not allow_long_videos and video.length and video.length > MAX_DURATION_SECONDS:
        raise HTTPException(status_code=403, detail="Video is too long for your plan")


def safe_download_name(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title)
    ascii_title = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_title).strip("-").lower()
    slug = re.sub(r"-+", "-", slug)[:80].strip("-")
    if not slug:
        slug = "video"
    return f"{slug}-{uuid4().hex[:8]}.mp4"


@app.post("/metadata")
def metadata(payload: VideoRequest, authorization: Optional[str] = Header(default=None)):
    verify_internal_token(authorization)
    video = load_video(str(payload.url))
    return video_metadata(video)


@app.post("/download")
def download(payload: VideoRequest, authorization: Optional[str] = Header(default=None)):
    verify_internal_token(authorization)
    video = load_video(str(payload.url))
    enforce_duration_limit(video, payload.allowLongVideos)

    try:
        stream = video.streams.filter(progressive=True, file_extension="mp4").order_by("resolution").desc().first()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read downloadable streams") from exc

    if stream is None:
        raise HTTPException(status_code=404, detail="No downloadable mp4 stream found")

    metadata = video_metadata(video)
    safe_name = safe_download_name(metadata["title"])

    try:
        output_path = stream.download(output_path=str(DOWNLOAD_DIR), filename=safe_name)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not download video") from exc

    file_name = Path(output_path).name

    return {
        "title": metadata["title"],
        "fileName": file_name,
        "downloadUrl": f"/files/{file_name}",
    }


@app.get("/files/{file_name}")
def file(file_name: str, authorization: Optional[str] = Header(default=None)):
    verify_internal_token(authorization)

    if "/" in file_name or ".." in file_name:
        raise HTTPException(status_code=400, detail="Invalid file name")

    file_path = DOWNLOAD_DIR / file_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, filename=file_name, media_type="video/mp4")
