# Frontend

This folder contains the React + Vite frontend for the network monitoring dashboard.

## Stack

- React 19
- Vite
- React Router
- Axios
- TanStack Query
- Zustand
- XYFlow

## Main Areas

- admin dashboard and protected admin routes
- site connectivity management
- microwave link budget management
- link level flow view
- client-facing dynamic pages
- JWT-based auth with bearer token requests

## Local Development

Install dependencies:

```bash
cd frontend
npm ci
```

Run the dev server:

```bash
npm run dev
```

By default, local development uses the same browser path as MVP production:

- the frontend calls `/api`
- the Vite dev server proxies `/api` to `http://127.0.0.1:8000`

This keeps local development simple:

- developers do not need to change frontend API URLs for normal local work
- browser requests stay same-origin from the frontend point of view
- most local CORS friction is avoided because Vite handles the proxy hop

If the backend is running somewhere else during development, override the proxy target in `frontend/.env.development`:

```text
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

If you need the frontend to call a fully qualified API URL directly, you can still override the client base URL:

```text
VITE_API_BASE_URL=https://example.com/api
```

## API Configuration

The shared Axios client lives in `src/api/axios.js`.

Default behavior:

- `VITE_API_BASE_URL` when explicitly set
- otherwise `/api`

That means the same frontend build can work in both:

- local development through the Vite proxy
- MVP deployment behind same-domain Nginx

## Auth Behavior

The frontend stores the access token in browser storage and sends:

```text
Authorization: Bearer <token>
```

Request loading state is coordinated through Axios interceptors in `src/api/axios.js`.

## MVP Production Behavior

In the MVP deployment:

- GitHub Actions builds `frontend/dist`
- `deploy.sh` copies the built files into `/var/www/app`
- Nginx serves the frontend on `/`
- Nginx proxies `/api` to the FastAPI backend on the same host

Because the frontend already defaults to `/api`, production does not need a separate browser-facing API host hardcoded into the client for the standard MVP shape.

## Notes For Infra

For the frontend to work without extra environment overrides, the infra side should preserve this contract:

- serve the SPA from `/`
- reverse proxy `/api` to the backend
- keep frontend and backend on the same public domain in MVP

If infra changes that contract, this frontend config and the deployment docs should be updated together.
