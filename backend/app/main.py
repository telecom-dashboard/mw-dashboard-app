from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.db import base  # noqa: F401
from app.routers import (
    auth,
    tools,
    microwave_link_budgets,
    client_pages,
    site_connectivity,
    link_level,
)

app = FastAPI(title="Network Ops Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(tools.router)
app.include_router(microwave_link_budgets.router)
app.include_router(client_pages.router)
app.include_router(site_connectivity.router)
app.include_router(link_level.router)


@app.get("/")
def root():
    return {
        "message": "Network Ops Dashboard backend is running",
        "environment": settings.app_env,
    }


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.app_env}
