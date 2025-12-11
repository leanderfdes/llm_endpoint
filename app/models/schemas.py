# app/models/schemas.py
from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    prompt: str = Field(
        ...,
        description="User prompt or question to send to the LLM",
    )
    max_tokens: int | None = Field(
        default=10000,  # ⬆ default from 256 → 10000
        ge=1,
        le=100000,       # ⬆ allow up to 100000 tokens
        description="Maximum tokens to generate (1–4096).",
    )


class AskResponse(BaseModel):
    answer: str = Field(..., description="LLM-generated answer")
    model: str | None = Field(default=None, description="Name of the model used")
    usage_tokens: int | None = Field(
        default=None, description="Token usage if available"
    )
