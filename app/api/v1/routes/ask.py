# app/api/v1/routes/ask.py
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ....models.schemas import AskRequest, AskResponse
from ....services.llm_client import LLMClient
from ....utils.errors import LLMServiceError

logger = logging.getLogger("app.api.v1.ask")

router = APIRouter(prefix="/ask", tags=["ask"])


def get_llm_client() -> LLMClient:
    """Dependency injection for LLMClient."""
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
        # ⬇️ no more `await` since ask() is now sync
        llm_result = llm_client.ask(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
        )

        answer = llm_result.get("answer", "")
        model_name = llm_result.get("model")
        usage = llm_result.get("usage") or {}

        response = AskResponse(
            answer=answer,
            model=model_name,
            usage_tokens=usage.get("prompt_tokens", 0)
            + usage.get("completion_tokens", 0),
        )
        logger.info("Successfully processed /ask request")
        logger.debug("Response body", extra={"response": response.dict()})
        return response

    except LLMServiceError as e:
        logger.error("LLMServiceError encountered", extra={"error": e.message})
        raise HTTPException(
            status_code=e.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=e.message,
        )

    except Exception as e:
        logger.exception("Unexpected error in /ask endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Please try again later.",
        ) from e
