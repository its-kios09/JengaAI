"""Jenga-AI API — FastAPI application entry point."""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: could initialize DB pool, warm caches, etc.
    yield
    # Shutdown: close connections, flush logs, etc.


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Attach a unique request ID for tracing."""
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


# --- API Routers ---
from app.api.v1 import compute  # noqa: E402

app.include_router(compute.router, prefix="/api/v1/compute", tags=["Compute"])

# Uncomment as they are built:
# from app.api.v1 import auth, projects, datasets, training, inference, templates
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
# app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
# app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
# app.include_router(training.router, prefix="/api/v1/training", tags=["Training"])
# app.include_router(inference.router, prefix="/api/v1/inference", tags=["Inference"])
# app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])
