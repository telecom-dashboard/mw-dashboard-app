# MW Dashboard App

This repository contains the application code for the network monitoring dashboard:

- `frontend/` is a React + Vite single-page app
- `backend/` is a FastAPI service with SQLAlchemy models and Excel import/export endpoints
- `.github/workflows/deploy.yml` drives the MVP deploy flow
- `deploy.sh` and `start.sh` are the host-side scripts used by the MVP EC2 deployment

## Repo Layout

- `frontend/`
  React client, built into static files for Nginx to serve.
- `backend/`
  FastAPI app, database models, schemas, routers, and backend runtime dependencies.
- [deploy.sh](./deploy.sh)
  Host-side deployment script executed through AWS Systems Manager Run Command.
- [start.sh](./start.sh)
  Host-side startup script used by the `saas-app` systemd service.
- `.github/workflows/deploy.yml`
  GitHub Actions workflow that builds the frontend, bundles the release, uploads to S3, and triggers SSM deploy on the MVP host.

## Application Architecture

The deployed MVP uses a same-domain layout:

- `/` serves the frontend static build
- `/api/` proxies to the FastAPI backend on the same EC2 host

This repo assumes the backend is reachable behind Nginx rather than directly from the browser in production.

## Local Development

### Frontend

The frontend is a Vite app. By default the API client uses:

- `VITE_API_BASE_URL` when provided
- otherwise `/api`
- in local development, Vite proxies `/api` to `VITE_DEV_API_TARGET`
- default local proxy target: `http://127.0.0.1:8000`

Typical local flow:

```bash
cd frontend
npm ci
npm run dev
```

This keeps the browser on a stable relative API path for both local and MVP usage.

### Backend

The backend is a FastAPI app with SQLAlchemy. It reads configuration from environment variables using `pydantic-settings`.

Important defaults in code:

- backend URL default: `http://localhost:8000`
- frontend URL default: `http://localhost:5173`
- allowed origins default: `http://localhost:5173,http://127.0.0.1:5173`

Typical local flow:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

See [backend/README.md](./backend/README.md) for backend-specific notes.

## MVP Infra Contract

This repo does not create infrastructure by itself. The current MVP deployment expects the infra repo to provide:

- one EC2 host running Ubuntu
- Nginx installed and configured for same-domain frontend + `/api` routing
- a systemd service named `saas-app`
- application directories:
  - `/var/www/app`
  - `/opt/app/current`
  - `/opt/app/shared`
- AWS CLI available on the host
- Python 3 and `python3-venv` available on the host
- the EC2 instance registered with AWS Systems Manager and online
- an S3 bucket for release artifacts
- an IAM role for GitHub Actions that can:
  - upload release artifacts to the bucket
  - send SSM Run Command to the MVP host
  - read command invocation results
- an EC2 tag used for deploy targeting:
  - `DeployTarget=<value from DEPLOY_TARGET_TAG_VALUE>`
- runtime access from the EC2 instance role to AWS Systems Manager Parameter Store for:
  - `/nw-monitor/mvp/backend/secret_key`
  - `/nw-monitor/mvp/backend/db_password`

If the infra repo changes any of the host paths, service name, or deploy target tag, this repo must stay aligned.

## Deployment From This Repo

The MVP deployment flow is:

1. GitHub Actions builds the frontend.
2. GitHub Actions bundles:
   - `frontend/dist`
   - `backend/`
   - `start.sh`
3. The workflow uploads the release tarball and `deploy.sh` to S3.
4. The workflow resolves the single running MVP instance by EC2 tag.
5. GitHub Actions sends an SSM Run Command to the tagged host.
6. The host executes [deploy.sh](./deploy.sh).
7. `deploy.sh` installs backend dependencies into a virtual environment and restarts `saas-app`.
8. The systemd service executes [start.sh](./start.sh), which fetches secrets from Parameter Store and launches Uvicorn.

See [deploy/README.md](./deploy/README.md) for the full deploy contract.

## Required GitHub Variables

The MVP deploy workflow expects these repository or environment variables:

- `AWS_REGION`
- `AWS_APP_MVP_ROLE_ARN` or `AWS_MVP_APP_DEPLOY_ROLE_ARN`
- `DEPLOY_BUCKET_NAME`
- `DEPLOY_PREFIX`
- `APP_DOMAIN`
- `DEPLOY_TARGET_TAG_VALUE`

Recommended tag setup in infra:

```text
DeployTarget=nw-monitor-dashboard-mvp-app-host
```

## Secrets And Runtime Configuration

Non-secret production configuration belongs in `backend/.env.production`.

Secrets are not committed here. In MVP they are fetched at runtime from Parameter Store by `start.sh`.

## Important Scripts

### `deploy.sh`

This script runs on the EC2 host during deployment. It:

- downloads the release tarball from S3
- extracts into `/opt/app/releases/<commit>`
- copies frontend assets into `/var/www/app`
- copies backend code into `/opt/app/current/backend`
- copies `start.sh` into `/opt/app/current/start.sh`
- creates or reuses a backend virtual environment
- installs backend dependencies from `backend/requirements.txt`
- restarts the `saas-app` systemd service

### `start.sh`

This script runs under systemd on the EC2 host. It:

- loads non-secret env vars from `/opt/app/shared/backend.env`
- fetches `SECRET_KEY` and `DB_PASSWORD` from Parameter Store
- uses the backend virtualenv under `/opt/app/current/backend/.venv`
- starts `uvicorn app.main:app`

## Related Docs

- [frontend/README.md](./frontend/README.md)
- [backend/README.md](./backend/README.md)
- [deploy/README.md](./deploy/README.md)
