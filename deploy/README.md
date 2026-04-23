# Deploy

This document explains how MVP deployment works from the app repo side.

## Current Deploy Shape

The MVP deploy flow is:

1. GitHub Actions builds the frontend.
2. GitHub Actions creates a release bundle containing:
   - `frontend/dist`
   - `backend/`
   - `start.sh`
3. GitHub Actions uploads:
   - the release tarball
   - `deploy.sh`
   to the MVP release bucket in S3.
4. GitHub Actions resolves the single running MVP instance using an EC2 tag.
5. GitHub Actions sends an SSM Run Command to the tagged host.
6. The EC2 host downloads and runs `deploy.sh`.
7. `deploy.sh` installs backend dependencies into a virtualenv and restarts `saas-app`.
8. `saas-app` executes `start.sh`, which fetches secrets and starts the backend.

## Workflow File

Primary workflow:

- `.github/workflows/deploy.yml`

Important behavior:

- deploy target is resolved by tag, not by exact instance ID
- SSM targeting uses:
  - `DEPLOY_TARGET_TAG_KEY`
  - `DEPLOY_TARGET_TAG_VALUE`
- the workflow validates that exactly one running instance matches the tag before sending the command

## Required GitHub Variables

- `AWS_REGION`
- `AWS_APP_MVP_ROLE_ARN` or `AWS_MVP_APP_DEPLOY_ROLE_ARN`
- `DEPLOY_BUCKET_NAME`
- `DEPLOY_PREFIX`
- `APP_DOMAIN`
- `DEPLOY_TARGET_TAG_VALUE`

Optional GitHub environment secrets for automatic admin bootstrap:

- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

When all three are set, the deploy workflow passes them to `deploy.sh`, and the backend seed script will create the admin user if it does not already exist.

Default workflow tag key:

```text
DeployTarget
```

Recommended tag value:

```text
nw-monitor-dashboard-mvp-app-host
```

## Infra Requirements

The infra side must provide:

- a running EC2 instance tagged with:
  - `DeployTarget=<DEPLOY_TARGET_TAG_VALUE>`
- SSM-managed EC2 host
- S3 release bucket
- GitHub deploy IAM role with permissions to:
  - upload release artifacts to S3
  - send `ssm:SendCommand`
  - read command invocation results
- EC2 instance role permissions to:
  - read release artifacts from S3
  - read required Parameter Store values

The host must also have:

- Nginx
- Python 3
- `python3-venv`
- AWS CLI
- systemd service `saas-app`
- writable deployment directories:
  - `/var/www/app`
  - `/opt/app/current`
  - `/opt/app/shared`

For the standard MVP deployment shape, Nginx should:

- serve the frontend SPA from `/`
- reverse proxy `/api` to the backend process listening on the host
- keep the frontend and backend on the same public domain

That contract matches the frontend default API base path of `/api`, so developers do not need separate browser-facing production URLs hardcoded into the frontend for normal MVP operation.

## `deploy.sh`

`deploy.sh` is executed on the EC2 host through SSM.

Responsibilities:

- download the release tarball from S3
- extract it under `/opt/app/releases/<commit-sha>`
- publish frontend files to `/var/www/app`
- publish backend files to `/opt/app/current/backend`
- publish `start.sh` to `/opt/app/current/start.sh`
- create or update the backend virtualenv
- install backend dependencies using the virtualenv `pip`
- optionally seed the admin user when `SEED_ADMIN_*` values are provided by the workflow
- restart `saas-app`

Important defaults:

- frontend root: `/var/www/app`
- app root: `/opt/app/current`
- backend dir: `/opt/app/current/backend`
- venv dir: `/opt/app/current/backend/.venv`

## `start.sh`

`start.sh` is executed by systemd on the EC2 host.

Responsibilities:

- load `/opt/app/shared/backend.env`
- fetch secrets from Parameter Store
- rebuild the runtime database URL from `DB_*` values plus the fetched DB password
- export `SECRET_KEY` and `DB_PASSWORD`
- start `uvicorn` from the backend virtualenv

Important defaults:

- env file: `/opt/app/shared/backend.env`
- app dir: `/opt/app/current/backend`
- venv dir: `/opt/app/current/backend/.venv`

Runtime note:

- the app repo now treats the SSM-fetched `DB_PASSWORD` as the source of truth for backend DB access
- a stale inherited service-level `DATABASE_URL` should not be relied on to carry the runtime DB password

## Release Bundle Contract

The workflow expects the release archive to unpack like this:

- `frontend/`
- `backend/`
- `start.sh`

`deploy.sh` depends on that structure. If you change the release contents, update the deploy script accordingly.

## Typical MVP Deploy Sequence

Push to `main` or trigger the workflow manually:

1. frontend build runs
2. release bundle is created
3. bundle and deploy script are uploaded to S3
4. workflow resolves the running tagged EC2 instance
5. SSM Run Command executes `deploy.sh`
6. workflow waits for completion and fetches the command result

## Failure Checklist

If deploy fails, check in this order:

1. GitHub Actions `Fetch SSM result`
2. whether exactly one running instance matches the deploy tag
3. whether the EC2 instance is online in SSM
4. whether the deploy IAM role still allows `ssm:SendCommand` to the target host
5. on the EC2 host:

```bash
sudo systemctl status saas-app --no-pager
sudo journalctl -u saas-app -n 200 --no-pager
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 200 --no-pager
```

## Cross-Repo Notes

This repo depends on the infra repo staying aligned on:

- EC2 host tag used for deploy selection
- Nginx frontend/backend routing
- `saas-app` service name
- host directory layout
- Parameter Store paths
- IAM permissions for GitHub deploy and EC2 runtime access
