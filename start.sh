#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
ENV_FILE="${ENV_FILE:-/opt/app/shared/backend.env}"
APP_DIR="${APP_DIR:-/opt/app/current/backend}"
VENV_DIR="${VENV_DIR:-${APP_DIR}/.venv}"
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

# Rebuild DATABASE_URL from the current env plus the freshly fetched secret
# so an inherited service-level DATABASE_URL cannot carry a stale password.
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-network_ops_db}"
DB_USER="${DB_USER:-postgres}"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# 3. Start the backend
echo "[start] Starting backend on ${LISTEN_HOST}:${LISTEN_PORT} ..."
cd "$APP_DIR"
exec "${VENV_DIR}/bin/uvicorn" app.main:app \
  --host "$LISTEN_HOST" \
  --port "$LISTEN_PORT" \
  --log-level info
