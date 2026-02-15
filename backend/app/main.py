"""Jenga-AI API — FastAPI application entry point."""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.rate_limit import limiter
from app.api.v1 import auth, compute, datasets


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


<<<<<<< Updated upstream
# --- API Routers ---
from app.api.v1 import auth, compute  # noqa: E402
=======
Path("uploads/avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
>>>>>>> Stashed changes

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(compute.router, prefix="/api/v1/compute", tags=["Compute"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
