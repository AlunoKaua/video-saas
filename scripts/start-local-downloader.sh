#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${DOWNLOADER_PORT:-8011}"
LOG_DIR="$ROOT_DIR/.local-runtime"
DOWNLOADER_LOG="$LOG_DIR/downloader.log"
TUNNEL_LOG="$LOG_DIR/cloudflared.log"
DOWNLOADER_PID_FILE="$LOG_DIR/downloader.pid"
TUNNEL_PID_FILE="$LOG_DIR/cloudflared.pid"

mkdir -p "$LOG_DIR"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: comando '$1' não encontrado."
    exit 1
  fi
}

stop_pid_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    local pid
    pid="$(cat "$file")"
    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$file"
  fi
}

require_command cloudflared
require_command vercel

if [[ ! -x ".venv/bin/uvicorn" ]]; then
  echo "Instalando dependências Python na .venv..."
  python -m venv .venv
  .venv/bin/pip install -r services/downloader/requirements.txt
fi

if [[ ! -f ".env" ]]; then
  echo "Erro: arquivo .env não encontrado."
  exit 1
fi

if [[ ! -f "youtube-cookies.txt" ]]; then
  echo "Erro: youtube-cookies.txt não encontrado na raiz do projeto."
  exit 1
fi

stop_pid_file "$DOWNLOADER_PID_FILE"
stop_pid_file "$TUNNEL_PID_FILE"

set -a
# shellcheck disable=SC1091
. ./.env
set +a

export YOUTUBE_COOKIES_GZIP_BASE64="$(gzip -9 -c youtube-cookies.txt | base64 -w 0)"

: > "$DOWNLOADER_LOG"
: > "$TUNNEL_LOG"

.venv/bin/uvicorn services.downloader.main:app --host 127.0.0.1 --port "$PORT" > "$DOWNLOADER_LOG" 2>&1 &
echo $! > "$DOWNLOADER_PID_FILE"

for _ in {1..30}; do
  if python - <<PY >/dev/null 2>&1
import urllib.request
urllib.request.urlopen('http://127.0.0.1:${PORT}/docs', timeout=1).read()
PY
  then
    break
  fi
  sleep 1
done

if ! python - <<PY >/dev/null 2>&1
import urllib.request
urllib.request.urlopen('http://127.0.0.1:${PORT}/docs', timeout=2).read()
PY
then
  echo "Erro: downloader local não iniciou. Veja $DOWNLOADER_LOG"
  exit 1
fi

cloudflared tunnel --url "http://127.0.0.1:${PORT}" > "$TUNNEL_LOG" 2>&1 &
echo $! > "$TUNNEL_PID_FILE"

TUNNEL_URL=""
for _ in {1..60}; do
  TUNNEL_URL="$(grep -Eo 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || true)"
  if [[ -n "$TUNNEL_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Erro: túnel Cloudflare não gerou URL. Veja $TUNNEL_LOG"
  exit 1
fi

echo "Downloader local: http://127.0.0.1:${PORT}"
echo "Túnel público: $TUNNEL_URL"

echo "Atualizando DOWNLOADER_SERVICE_URL na Vercel..."
vercel env add DOWNLOADER_SERVICE_URL production --value "$TUNNEL_URL" --no-sensitive --force --yes >/dev/null

echo "Fazendo redeploy da Vercel..."
vercel --prod

echo
echo "Pronto. O webapp está usando: $TUNNEL_URL"
echo "Mantenha este PC ligado. Logs:"
echo "- $DOWNLOADER_LOG"
echo "- $TUNNEL_LOG"
