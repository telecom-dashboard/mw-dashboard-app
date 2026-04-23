#!/usr/bin/env bash
set -euo pipefail

# Expected environment variables (set by GitHub Actions):
#   S3_BUCKET   - S3 bucket name
#   S3_KEY      - S3 object key of the release tarball
#   GITHUB_SHA  - commit SHA (used for release directory name)

S3_BUCKET="${S3_BUCKET:?S3_BUCKET is required}"
S3_KEY="${S3_KEY:?S3_KEY is required}"
GITHUB_SHA="${GITHUB_SHA:?GITHUB_SHA is required}"

RELEASE_DIR="/opt/app/releases/${GITHUB_SHA}"
FRONTEND_ROOT="/var/www/app"
APP_ROOT="/opt/app/current"
BACKEND_DIR="${APP_ROOT}/backend"
SHARED_ENV="/opt/app/shared/backend.env"
VENV_DIR="${VENV_DIR:-${BACKEND_DIR}/.venv}"
DB_INIT_SCRIPT="${APP_ROOT}/init_local_postgres.sh"
PARAM_PREFIX="/nw-monitor/mvp/backend"

echo "[deploy] Downloading artifact from s3://${S3_BUCKET}/${S3_KEY} ..."
aws s3 cp "s3://${S3_BUCKET}/${S3_KEY}" /tmp/deploy.tar.gz

echo "[deploy] Extracting to ${RELEASE_DIR} ..."
mkdir -p "${RELEASE_DIR}"
tar xzf /tmp/deploy.tar.gz -C /opt/app/releases/

echo "[deploy] Deploying frontend to ${FRONTEND_ROOT} ..."
mkdir -p "${FRONTEND_ROOT}"
rm -rf "${FRONTEND_ROOT:?}"/*
cp -r "${RELEASE_DIR}/frontend/"* "${FRONTEND_ROOT}/"

echo "[deploy] Deploying app files to ${APP_ROOT} ..."
mkdir -p "${APP_ROOT}"
rm -rf "${BACKEND_DIR}"
cp -r "${RELEASE_DIR}/backend" "${BACKEND_DIR}"
cp "${RELEASE_DIR}/deploy/init_local_postgres.sh" "${DB_INIT_SCRIPT}"
cp "${RELEASE_DIR}/start.sh" "${APP_ROOT}/start.sh"
chmod +x "${DB_INIT_SCRIPT}"
chmod +x "${APP_ROOT}/start.sh"

echo "[deploy] Ensuring shared env file exists ..."
mkdir -p /opt/app/shared
if [ ! -f "${SHARED_ENV}" ]; then
  echo "[deploy] Creating ${SHARED_ENV} from example ..."
  cp "${BACKEND_DIR}/.env.production.example" "${SHARED_ENV}"
fi

echo "[deploy] Installing backend dependencies ..."
cd "${BACKEND_DIR}"
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --quiet --upgrade pip
"${VENV_DIR}/bin/pip" install --quiet -r requirements.txt

echo "[deploy] Fetching DB password from Parameter Store for bootstrap tasks ..."
DB_PASSWORD="$(aws ssm get-parameter \
  --name "${PARAM_PREFIX}/db_password" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)"
export DB_PASSWORD

echo "[deploy] Bootstrapping local PostgreSQL ..."
"${DB_INIT_SCRIPT}"

echo "[deploy] Restarting backend service to create tables ..."
systemctl restart saas-app

echo "[deploy] Seeding initial data ..."
if [ -f "${SHARED_ENV}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${SHARED_ENV}"
  set +a
fi
export DATABASE_URL="postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@${DB_HOST:-127.0.0.1}:${DB_PORT:-5432}/${DB_NAME:-network_ops_db}"
if [ -n "${SEED_ADMIN_USERNAME:-}" ] && [ -n "${SEED_ADMIN_EMAIL:-}" ] && [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  echo "[deploy] Admin seed values supplied by deploy environment."
else
  echo "[deploy] Admin seed values not fully supplied by deploy environment. Falling back to shared env if present."
fi
for attempt in 1 2 3 4 5; do
  if APP_ENV=production "${VENV_DIR}/bin/python" -m app.scripts.seed_initial_data; then
    break
  fi

  if [ "${attempt}" -eq 5 ]; then
    echo "[deploy] Seeding failed after ${attempt} attempts." >&2
    exit 1
  fi

  echo "[deploy] Seed attempt ${attempt} failed. Waiting for backend startup before retrying ..."
  sleep 2
done

echo "[deploy] Restarting backend service ..."
systemctl restart saas-app

echo "[deploy] Cleaning up ..."
rm -f /tmp/deploy.tar.gz

echo "[deploy] Done."
