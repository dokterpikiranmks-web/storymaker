#!/usr/bin/env bash
# =============================================================================
# Dokter Pikiran Worker - 1-click installer for Google Cloud VM (Ubuntu 22.04)
#
# Secrets are NEVER stored in this repo. Pass them as environment variables:
#
#   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... WORKER_SECRET=... \
#   [DATABASE_URL=...] [WA_SESSION_DATA=<base64>] [TARGET_CHAT_JID=...] \
#   bash <(curl -fsSL https://raw.githubusercontent.com/dokterpikiranmks-web/storymaker/main/deploy/gcp-auto-install.sh)
# =============================================================================
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

REPO_URL="https://github.com/dokterpikiranmks-web/storymaker.git"
APP_DIR="$HOME/storymaker"
PM2_NAME="dokter-pikiran-worker"

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
die() { echo -e "\033[1;31mERROR: $*\033[0m" >&2; exit 1; }

# ---- 0. Validate required secrets ------------------------------------------
: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"
: "${WORKER_SECRET:?WORKER_SECRET is required}"
STORYMAKER_URL="${STORYMAKER_URL:-https://storymaker-jet.vercel.app}"
CONFIG_TIMEZONE="${CONFIG_TIMEZONE:-Asia/Makassar}"

# ---- 1. System packages -----------------------------------------------------
log "Installing system packages"
sudo apt-get update -y
sudo apt-get install -y curl git build-essential

# ---- 2. Node.js 20 LTS ------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  log "Installing Node.js 20.x (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "node $(node -v) / npm $(npm -v)"

# ---- 3. PM2 -----------------------------------------------------------------
log "Installing PM2"
sudo npm install -g pm2

# ---- 4. Repository ----------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  log "Updating existing repo in $APP_DIR"
  git -C "$APP_DIR" pull --ff-only origin main || echo "WARN: git pull failed, using existing code"
else
  log "Cloning repo into $APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ---- 5. Dependencies --------------------------------------------------------
log "npm install --omit=dev (root)"
npm install --omit=dev --no-audit --no-fund
if [ -f worker/package.json ]; then
  log "npm install --omit=dev (worker)"
  (cd worker && npm install --omit=dev --no-audit --no-fund)
fi

# ---- 6. .env ----------------------------------------------------------------
log "Writing .env"
umask 077
{
  echo "SUPABASE_URL=$SUPABASE_URL"
  echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  echo "CONFIG_TIMEZONE=$CONFIG_TIMEZONE"
  echo "APP_TIMEZONE=$CONFIG_TIMEZONE"
  echo "STORYMAKER_URL=$STORYMAKER_URL"
  echo "WORKER_SECRET=$WORKER_SECRET"
  [ -n "${DATABASE_URL:-}" ]     && echo "DATABASE_URL=$DATABASE_URL"
  [ -n "${WA_SESSION_DATA:-}" ]  && echo "WA_SESSION_DATA=$WA_SESSION_DATA"
  [ -n "${TARGET_CHAT_JID:-}" ]  && echo "TARGET_CHAT_JID=$TARGET_CHAT_JID"
} > .env
cp .env worker/.env
chmod 600 .env worker/.env

# ---- 7. Start worker under PM2 ---------------------------------------------
log "Starting worker with PM2"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
# cwd = worker/ so dotenv picks up worker/.env and session files land in worker/
pm2 start worker/index.mjs --name "$PM2_NAME" --cwd "$APP_DIR/worker"

# ---- 8. Persistence ---------------------------------------------------------
log "Configuring PM2 startup (systemd)"
pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null
pm2 save

log "DONE - worker status:"
pm2 status
echo
echo "Logs:  pm2 logs $PM2_NAME"
echo "If WhatsApp needs a QR scan (no WA_SESSION_DATA given), see the logs above."
