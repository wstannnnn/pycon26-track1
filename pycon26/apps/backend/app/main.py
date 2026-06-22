from contextlib import asynccontextmanager
from pathlib import Path
import sys

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import close_db, init_db
from app.api_logging import log_requests
from app.routers import auth, health, learner, roles, users, vectors


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Job and Skills Track API",
    description="Career pathways, role-to-skill maps, and reskilling recommendations.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(log_requests)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(learner.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(vectors.router)
