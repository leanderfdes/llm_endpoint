# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "LLM API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Example LLM-related configs (adapt as needed)
    LLM_API_BASE_URL: str = "https://example-llm-api.com/v1/chat"
    GEMINI_API_KEY: str | None = None  

    # Pydantic v2 style config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
