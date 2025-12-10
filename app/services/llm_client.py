import logging
import google.generativeai as genai

from ..utils.errors import LLMServiceError
from ..core.config import settings

logger = logging.getLogger("app.services.llm_client")


class LLMClient:
    """
    Google Gemini implementation of the LLM client.
    """

    def __init__(self, model: str = "models/gemini-2.5-flash"):
        self.model_name = model

        if not settings.GEMINI_API_KEY:
            raise LLMServiceError("Gemini API key missing in environment variables.")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.model_name)

    def ask(self, prompt: str, max_tokens: int | None = 1024) -> dict:
        try:
            logger.debug("Sending prompt to Gemini", extra={"prompt": prompt[:100]})

            response = self.model.generate_content(
                prompt,
                generation_config={
                    "max_output_tokens": max_tokens,
                },
            )

            # --- SAFER HANDLING OF RESPONSE ---

            # 1) Make sure we actually got candidates
            if not response.candidates:
                raise LLMServiceError(
                    "Gemini did not return any candidates. "
                    "This can happen if the request was blocked by safety filters "
                    "or the prompt was invalid."
                )

            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)

            # 2) Extract text parts manually instead of using response.text
            parts = []
            if candidate.content and getattr(candidate.content, "parts", None):
                for part in candidate.content.parts:
                    # Some parts may be images etc., we only care about text
                    if hasattr(part, "text") and part.text:
                        parts.append(part.text)

            if not parts:
                # No text parts returned → likely blocked or empty
                raise LLMServiceError(
                    f"Gemini returned no text (finish_reason={finish_reason}). "
                    "This usually means the response was blocked by safety filters "
                    "or the model chose not to answer."
                )

            answer = "".join(parts)

            # 3) Usage metadata (if available)
            usage_meta = getattr(response, "usage_metadata", None)
            usage = {
                "prompt_tokens": getattr(usage_meta, "prompt_token_count", None),
                "completion_tokens": getattr(usage_meta, "candidates_token_count", None),
                "total_tokens": getattr(usage_meta, "total_token_count", None),
            } if usage_meta else {}

            logger.debug("Gemini response received", extra={"usage": usage})

            return {
                "answer": answer,
                "model": self.model_name,
                "usage": usage,
            }

        except LLMServiceError:
            # Re-raise our own clean error
            raise
        except Exception as e:
            logger.exception("Gemini LLM error")
            raise LLMServiceError(f"Gemini API error: {e}")

