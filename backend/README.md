# Backend

This folder contains the FastAPI backend for the network monitoring dashboard.

## Stack

- FastAPI
- SQLAlchemy
- Pydantic / pydantic-settings
- PostgreSQL
- Pandas / OpenPyXL for Excel import-export flows
- Uvicorn

## App Structure

- `app/main.py`
  FastAPI app entrypoint and router registration.
- `app/core/`
  runtime config, database engine, security helpers.
- `app/models/`
  SQLAlchemy models.
- `app/schemas/`
  request/response models.
- `app/routers/`
  API routes.
- `app/db/`
  database base imports.

## Key Runtime Behavior

The backend registers these route groups:

- `auth`
- `tools`
- `microwave-link-budgets`
- `site-connectivity`
- `client-pages`
- `link-level`

On startup, `Base.metadata.create_all(bind=engine)` runs from `app/main.py`, so the app currently creates tables directly rather than using a migration tool.

## Configuration

Configuration is loaded through `app/core/config.py`.

Important settings include:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FRONTEND_URL`
- `BACKEND_URL`
- `ALLOWED_ORIGINS`

Behavior:

- if `DATABASE_URL` is set, it is used directly
- otherwise the app builds a PostgreSQL URL from the DB parts

Environment file selection:

- `APP_ENV=production` uses `.env.production`
- otherwise it uses `.env.development`

## Local Development

Create a virtual environment and install runtime dependencies:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run the API locally:

```bash
uvicorn app.main:app --reload
```

Default local URL:

```text
http://127.0.0.1:8000
```

When the frontend is also running locally through Vite, the recommended setup is:

- frontend requests use `/api`
- Vite proxies `/api` to this backend URL

That keeps local browser behavior close to MVP production and avoids needing separate frontend API host changes for normal local development.

## Production Configuration

Use `backend/.env.production.example` as the template for non-secret production config.

In the MVP deployment:

- non-secret config lives at `/opt/app/shared/backend.env`
- secrets are fetched at runtime by `start.sh` from AWS Systems Manager Parameter Store
- Nginx reverse proxies `/api` to the backend service on the same host

Expected Parameter Store paths:

- `/nw-monitor/mvp/backend/secret_key`
- `/nw-monitor/mvp/backend/db_password`

## Requirements File

`requirements.txt` is intentionally trimmed to Linux server/runtime dependencies.

It includes:

- FastAPI runtime
- database/auth/config dependencies
- file upload support
- pandas/openpyxl/xlrd for the existing import/export routes

It should not be treated as a dump of every package from a local workstation.

If you add new backend features, keep dependencies production-focused and avoid reintroducing local-only GUI, notebook, or Windows-only packages.

## MVP Runtime Layout

When deployed to the MVP EC2 host:

- backend code lives at `/opt/app/current/backend`
- backend virtualenv lives at `/opt/app/current/backend/.venv`
- startup script lives at `/opt/app/current/start.sh`
- systemd service name is `saas-app`

The service starts Uvicorn through the virtualenv, not the system interpreter.
