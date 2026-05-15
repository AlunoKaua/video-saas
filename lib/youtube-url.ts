const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com"
]);

export function parseYouTubeUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    return null;
  }

  if (url.hostname === "youtu.be") {
    return url.pathname.length > 1 ? url.toString() : null;
  }

  if (url.pathname === "/watch" && url.searchParams.get("v")) {
    return url.toString();
  }

  if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
    return url.toString();
  }

  return null;
}
