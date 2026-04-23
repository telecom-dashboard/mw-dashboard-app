from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.db import base  # noqa: F401
from app.routers import (
    auth,
    audit_logs,
    tools,
    microwave_link_budgets,
    client_pages,
    site_connectivity,
    link_level,
    users,
)

API_PREFIX = "/api"

app = FastAPI(title="Network Ops Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(audit_logs.router, prefix=API_PREFIX)
app.include_router(tools.router, prefix=API_PREFIX)
app.include_router(microwave_link_budgets.router, prefix=API_PREFIX)
app.include_router(client_pages.router, prefix=API_PREFIX)
app.include_router(site_connectivity.router, prefix=API_PREFIX)
app.include_router(link_level.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)


@app.get("/")
@app.get(API_PREFIX)
def root():
    return {
        "message": "Network Ops Dashboard backend is running",
        "environment": settings.app_env,
    }


@app.get("/health")
@app.get(f"{API_PREFIX}/health")
def health():
    return {"status": "ok", "environment": settings.app_env}
