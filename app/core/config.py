# app/core/config.py
from pydantic import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "LLM API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Example LLM-related configs (adapt as needed)
    LLM_API_BASE_URL: str = "https://example-llm-api.com/v1/chat"
    LLM_API_KEY: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
