from pathlib import Path
from tempfile import gettempdir
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from yt_dlp import YoutubeDL

import base64
import gzip
import logging
import os
import re
import unicodedata

app = FastAPI(title="Video SaaS Downloader")
logger = logging.getLogger("video_saas_downloader")

MAX_DURATION_SECONDS = 60 * 30
DOWNLOAD_DIR = Path(gettempdir()) / "video-saas-downloads"
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
COOKIES_FILE = DOWNLOAD_DIR / "youtube-cookies.txt"


class VideoRequest(BaseModel):
    url: HttpUrl
    allowLongVideos: bool = False


def verify_internal_token(authorization: Optional[str]) -> None:
    expected = os.getenv("INTERNAL_API_TOKEN")
    if not expected:
        raise HTTPException(status_code=500, detail="INTERNAL_API_TOKEN not configured")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def youtube_cookie_file() -> Optional[str]:
    cookies_gzip_base64 = os.getenv("YOUTUBE_COOKIES_GZIP_BASE64")
    cookies_base64 = os.getenv("YOUTUBE_COOKIES_BASE64")
    if not cookies_gzip_base64 and not cookies_base64:
        return None

    try:
        if cookies_gzip_base64:
            cookies = gzip.decompress(base64.b64decode(cookies_gzip_base64)).decode("utf-8")
        else:
            cookies = base64.b64decode(cookies_base64 or "").decode("utf-8")
    except Exception as exc:
        logger.exception("Invalid YouTube cookies env")
        raise HTTPException(status_code=500, detail="Cookies do YouTube inválidos") from exc

    if not COOKIES_FILE.exists() or COOKIES_FILE.read_text() != cookies:
        COOKIES_FILE.write_text(cookies)

    return str(COOKIES_FILE)


def ydl_options(**overrides):
    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extract_flat": False,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web_creator"],
            },
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
    }

    cookie_file = youtube_cookie_file()
    if cookie_file:
        options["cookiefile"] = cookie_file

    options.update(overrides)
    return options


def load_metadata(url: str) -> dict:
    try:
        with YoutubeDL(ydl_options(skip_download=True)) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:
        logger.exception("Could not read video metadata")
        raise HTTPException(status_code=400, detail="Não foi possível consultar o vídeo. O YouTube pode ter bloqueado o servidor temporariamente.") from exc

    return {
        "title": info.get("title") or "video",
        "author": info.get("uploader") or info.get("channel"),
        "thumbnail": info.get("thumbnail"),
        "durationSeconds": info.get("duration"),
    }


def enforce_duration_limit(duration_seconds: Optional[int], allow_long_videos: bool) -> None:
    if not allow_long_videos and duration_seconds and duration_seconds > MAX_DURATION_SECONDS:
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
    return load_metadata(str(payload.url))


@app.post("/download")
def download(payload: VideoRequest, authorization: Optional[str] = Header(default=None)):
    verify_internal_token(authorization)
    metadata = load_metadata(str(payload.url))
    enforce_duration_limit(metadata["durationSeconds"], payload.allowLongVideos)

    safe_name = safe_download_name(metadata["title"])
    output_template = str(DOWNLOAD_DIR / safe_name)

    try:
        with YoutubeDL(
            ydl_options(
                format="best[ext=mp4]/best",
                outtmpl=output_template,
                merge_output_format="mp4",
            )
        ) as ydl:
            ydl.download([str(payload.url)])
    except Exception as exc:
        logger.exception("Could not download video")
        raise HTTPException(status_code=400, detail="Não foi possível baixar o vídeo. O YouTube pode ter bloqueado o servidor temporariamente.") from exc

    file_path = DOWNLOAD_DIR / safe_name
    if not file_path.exists():
        matches = list(DOWNLOAD_DIR.glob(f"{Path(safe_name).stem}.*"))
        if not matches:
            raise HTTPException(status_code=404, detail="Downloaded file not found")
        file_path = matches[0]

    return {
        "title": metadata["title"],
        "fileName": file_path.name,
        "downloadUrl": f"/files/{file_path.name}",
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
