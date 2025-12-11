# app/api/v1/routes/ask.py
import logging
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from ....models.schemas import AskRequest, AskResponse
from ....services.llm_client import LLMClient
from ....utils.errors import LLMServiceError

logger = logging.getLogger("app.api.v1.ask")

router = APIRouter(prefix="/ask", tags=["ask"])


@lru_cache(maxsize=1)
def get_llm_client() -> LLMClient:
    """
    Cached dependency that returns a single LLMClient instance per process.
    This prevents re-initializing the Gemini client for every incoming request.
    """
    return LLMClient()


@router.post(
    "",
    response_model=AskResponse,
    summary="Ask the LLM a question",
    description="Send a prompt to the underlying LLM model and get an answer back.",
)
async def ask_llm(
    request: AskRequest,
    llm_client: LLMClient = Depends(get_llm_client),
) -> AskResponse:
    logger.info("Received /ask request")
    logger.debug("Request body", extra={"request": request.dict()})

    try:
        llm_result = llm_client.ask(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
        )

        answer = llm_result.get("answer", "")
        model_name = llm_result.get("model")
        usage = llm_result.get("usage") or {}

        # compute usage tokens defensively
        prompt_tokens = usage.get("prompt_tokens") or 0
        completion_tokens = usage.get("completion_tokens") or 0
        total_tokens = usage.get("total_tokens")
        # If total_tokens missing, sum prompt + completion
        usage_tokens = int(total_tokens) if total_tokens else int(prompt_tokens) + int(completion_tokens)

        response = AskResponse(
            answer=answer,
            model=model_name,
            usage_tokens=usage_tokens,
        )
        logger.info("Successfully processed /ask request")
        logger.debug("Response body", extra={"response": response.dict()})
        return response

    except LLMServiceError as e:
        # LLMServiceError includes a message and optionally status_code
        logger.error("LLMServiceError encountered", extra={"error": getattr(e, "message", str(e))})
        raise HTTPException(
            status_code=getattr(e, "status_code", status.HTTP_502_BAD_GATEWAY),
            detail=getattr(e, "message", str(e)),
        )

    except Exception as e:
        logger.exception("Unexpected error in /ask endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Please try again later.",
        ) from e
