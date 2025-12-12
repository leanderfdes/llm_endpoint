# app/main.py
import logging
from typing import List

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import api_v1_router
from .core.config import settings
from .core.logging_config import setup_logging
from .utils.errors import LLMServiceError

# Configure logging before creating the app
setup_logging()
logger = logging.getLogger("app.main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)


def _build_allowed_origins() -> List[str]:
    """
    Build the allow_origins list from settings.ALLOWED_ORIGINS.
    Includes Vercel frontend and local dev URLs.
    """
    vercel_frontend = "https://llm-playground-fastapi-gemini-nffi.vercel.app"

    default_local = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        vercel_frontend,
    ]

    if settings.ALLOWED_ORIGINS:
        items = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
        merged = list(dict.fromkeys(items + default_local))
        return merged

    return default_local


allowed_origins = _build_allowed_origins()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Configured allowed CORS origins: %s", allowed_origins)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the application")


@app.exception_handler(LLMServiceError)
async def llm_service_error_handler(request: Request, exc: LLMServiceError):
    logger.error(
        "LLMServiceError (global handler)",
        extra={
            "path": request.url.path,
            "error": exc.message,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


# Versioned API routers
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }
