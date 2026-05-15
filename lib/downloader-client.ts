type DownloaderMetadata = {
  title: string;
  author?: string;
  thumbnail?: string;
  durationSeconds?: number;
};

type DownloaderResult = {
  title: string;
  fileName: string;
  downloadUrl: string;
};

type DownloaderOptions = {
  allowLongVideos?: boolean;
};

export const FREE_DURATION_LIMIT_SECONDS = 60 * 30;

function downloaderHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN ?? ""}`
  };
}

function getDownloaderUrl(path: string) {
  const baseUrl = process.env.DOWNLOADER_SERVICE_URL;
  if (!baseUrl) throw new Error("DOWNLOADER_SERVICE_URL não configurado.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function getDownloaderError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.detail ?? data?.error ?? fallback;
}

function downloaderBody(url: string, options?: DownloaderOptions) {
  return JSON.stringify({
    url,
    allowLongVideos: options?.allowLongVideos ?? false
  });
}

export async function fetchVideoMetadata(url: string, options?: DownloaderOptions): Promise<DownloaderMetadata> {
  const response = await fetch(getDownloaderUrl("/metadata"), {
    method: "POST",
    headers: downloaderHeaders(),
    body: downloaderBody(url, options),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await getDownloaderError(response, "Não foi possível consultar o vídeo."));
  }

  return response.json();
}

export async function requestVideoDownload(url: string, options?: DownloaderOptions): Promise<DownloaderResult> {
  const response = await fetch(getDownloaderUrl("/download"), {
    method: "POST",
    headers: downloaderHeaders(),
    body: downloaderBody(url, options),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await getDownloaderError(response, "Não foi possível baixar o vídeo."));
  }

  const result = (await response.json()) as DownloaderResult;
  if (!result.downloadUrl) {
    throw new Error("O serviço de download não retornou um link para o arquivo.");
  }

  return result;
}
