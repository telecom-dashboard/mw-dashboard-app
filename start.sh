#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
ENV_FILE="${ENV_FILE:-/opt/app/shared/backend.env}"
APP_DIR="${APP_DIR:-/opt/app/current/backend}"
PARAM_PREFIX="/nw-monitor/mvp/backend"
LISTEN_HOST="${LISTEN_HOST:-0.0.0.0}"
LISTEN_PORT="${LISTEN_PORT:-8000}"
# ───────────────────────────────────────────────────────────────

# 1. Load non-secret environment variables
if [ -f "$ENV_FILE" ]; then
  echo "[start] Loading env file: $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "[start] WARNING: env file not found at $ENV_FILE, using defaults"
fi

# 2. Fetch secrets from AWS Parameter Store
echo "[start] Fetching SECRET_KEY from Parameter Store..."
SECRET_KEY=$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/secret_key" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)

echo "[start] Fetching DB_PASSWORD from Parameter Store..."
DB_PASSWORD=$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/db_password" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)

export SECRET_KEY
export DB_PASSWORD

# 3. Start the backend
echo "[start] Starting backend on ${LISTEN_HOST}:${LISTEN_PORT} ..."
cd "$APP_DIR"
exec uvicorn app.main:app \
  --host "$LISTEN_HOST" \
  --port "$LISTEN_PORT" \
  --log-level info
