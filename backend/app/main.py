from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.db import base  # noqa: F401
from app.routers import auth, sites, tools, microwave_links, microwave_link_imports

app = FastAPI(title="Network Ops Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(tools.router)
app.include_router(microwave_links.router)
app.include_router(microwave_link_imports.router)


@app.get("/")
def root():
    return {"message": "Network Ops Dashboard backend is running"}