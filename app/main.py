# app/main.py
import logging

from dotenv import load_dotenv  # Load environment variables from .env file
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .api.v1 import api_v1_router
from .core.config import settings
from .core.logging_config import setup_logging
from .utils.errors import LLMServiceError

# Load variables from .env into environment
load_dotenv()


# Configure logging before creating the app
setup_logging()
logger = logging.getLogger("app.main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the application")


# Register global exception handler for LLMServiceError (optional but neat)
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


# Include versioned API routers
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["health"])
async def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
