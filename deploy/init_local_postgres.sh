#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/opt/app/shared/backend.env"

if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-network_ops_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ "${DB_HOST}" != "127.0.0.1" ] && [ "${DB_HOST}" != "localhost" ]; then
  echo "[init-db] DB_HOST=${DB_HOST} is not local. Skipping local PostgreSQL bootstrap."
  exit 0
fi

echo "[init-db] Ensuring local PostgreSQL is running ..."
systemctl enable postgresql >/dev/null 2>&1 || true
systemctl start postgresql

ROLE_EXISTS=$(
  sudo -u postgres env PGPORT="${DB_PORT}" psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | tr -d '[:space:]'
)

if [ "${ROLE_EXISTS}" != "1" ]; then
  echo "[init-db] Creating role ${DB_USER} ..."
  if [ -n "${DB_PASSWORD}" ]; then
    sudo -u postgres env PGPORT="${DB_PORT}" psql -v ON_ERROR_STOP=1 <<EOF
CREATE ROLE "${DB_USER}" LOGIN PASSWORD '${DB_PASSWORD}';
EOF
  else
    sudo -u postgres env PGPORT="${DB_PORT}" psql -v ON_ERROR_STOP=1 <<EOF
CREATE ROLE "${DB_USER}" LOGIN;
EOF
  fi
else
  echo "[init-db] Role ${DB_USER} already exists."
  if [ -n "${DB_PASSWORD}" ]; then
    echo "[init-db] Ensuring password is set for role ${DB_USER} ..."
    sudo -u postgres env PGPORT="${DB_PORT}" psql -v ON_ERROR_STOP=1 <<EOF
ALTER ROLE "${DB_USER}" WITH PASSWORD '${DB_PASSWORD}';
EOF
  fi
fi

DB_EXISTS=$(
  sudo -u postgres env PGPORT="${DB_PORT}" psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | tr -d '[:space:]'
)

if [ "${DB_EXISTS}" != "1" ]; then
  echo "[init-db] Creating database ${DB_NAME} owned by ${DB_USER} ..."
  sudo -u postgres env PGPORT="${DB_PORT}" psql -v ON_ERROR_STOP=1 <<EOF
CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}";
EOF
else
  echo "[init-db] Database ${DB_NAME} already exists."
fi

echo "[init-db] Local PostgreSQL bootstrap complete."
