<<<<<<< Updated upstream
# Frontend

This folder contains the React frontend for the network monitoring dashboard.

## Stack

- React
- Vite
- Axios for API access

## Development

Install dependencies:

```bash
cd frontend
npm ci
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## API Configuration

The frontend API client is defined in `src/api/axios.js`.

It uses:

- `VITE_API_BASE_URL` when set
- otherwise `http://127.0.0.1:8000`

For local development that usually means:

- frontend on `http://localhost:5173`
- backend on `http://127.0.0.1:8000`

For MVP production, Nginx serves the frontend and reverse proxies `/api` on the same host/domain. When running behind same-domain Nginx, prefer a relative API base URL if you later simplify this configuration further.

## Auth Behavior

The frontend stores the access token in browser storage and sends it as:

```text
Authorization: Bearer <token>
```

Requests are handled through Axios interceptors in `src/api/axios.js`.

## Production Behavior

In the MVP deployment:

- GitHub Actions builds `frontend/dist`
- `deploy.sh` copies the built files into `/var/www/app`
- Nginx serves those files on `/`

The frontend is not deployed independently from the backend in the current MVP flow. A release bundle always includes both.
=======
# Network Ops Dashboard

A full-stack Telecom Network Operations Dashboard built with **React + Vite** on the frontend and **FastAPI + PostgreSQL** on the backend.  
This project is designed to manage telecom operational data such as **sites**, **microwave links**, **microwave link budgets**, **link status**, **imports**, and **client-facing pages**.

---

## Features

### Admin Features
- Admin dashboard with module navigation
- Site management
- Microwave links management
- Microwave link budget management
- Link status monitoring
- Ping page
- Import center
- Templates management
- Navigation management
- User management
- Audit logs

### Client Features
- Client site search
- Client link status page
- Dynamic client pages
- Export table data to Excel

### Authentication
- JWT-based login
- Role-based access control
- Protected admin/client routes

---

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- Lucide React
- Tailwind-style utility classes / custom CSS

### Backend
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- Pydantic
- python-jose
- passlib[bcrypt]

---

## Project Structure

```bash
network-ops-dashboard/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── ...
│   ├── requirements.txt
│   └── .env.development
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── README.md
>>>>>>> Stashed changes
