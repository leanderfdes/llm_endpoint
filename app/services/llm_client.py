# app/services/llm_client.py
import logging
from typing import Dict, Optional

import google.generativeai as genai

from ..utils.errors import LLMServiceError
from ..core.config import settings

logger = logging.getLogger("app.services.llm_client")


class LLMClient:
    """
    Google Gemini implementation of the LLM client.

    Notes:
    - Keeps a configured `genai.GenerativeModel` instance.
    - Validates and clamps requested `max_tokens` to a sane range.
    """

    # Safety limits: keep these conservative — models still have internal limits
    DEFAULT_MAX_TOKENS = 1024
    MAX_ALLOWED_TOKENS = 100000  # your backend validation may limit this too
    MIN_ALLOWED_TOKENS = 1

    def __init__(self, model: str = "models/gemini-2.5-flash"):
        self.model_name = model

        if not settings.GEMINI_API_KEY:
            # Clean internal error type that your route-layer knows how to handle
            raise LLMServiceError("Gemini API key missing in environment variables.")

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(self.model_name)
        except Exception as e:
            logger.exception("Failed to configure Gemini client")
            raise LLMServiceError(f"Failed to initialize Gemini client: {e}")

    def _clamp_max_tokens(self, max_tokens: Optional[int]) -> int:
        if not isinstance(max_tokens, int):
            return self.DEFAULT_MAX_TOKENS
        if max_tokens < self.MIN_ALLOWED_TOKENS:
            return self.MIN_ALLOWED_TOKENS
        if max_tokens > self.MAX_ALLOWED_TOKENS:
            return self.MAX_ALLOWED_TOKENS
        return max_tokens

    def ask(self, prompt: str, max_tokens: Optional[int] = None) -> Dict:
        """
        Send prompt to Gemini and return a normalized dict:
        {
            "answer": str,
            "model": str,
            "usage": {"prompt_tokens": int|None, "completion_tokens": int|None, "total_tokens": int|None}
        }

        Raises LLMServiceError on known failures.
        """
        max_tokens = self._clamp_max_tokens(max_tokens)

        try:
            logger.debug("Sending prompt to Gemini", extra={"prompt_start": prompt[:200], "max_tokens": max_tokens})

            # The google.generativeai client returns a response with .candidates
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "max_output_tokens": max_tokens,
                },
            )

            # --- SAFER HANDLING OF RESPONSE ---
            if not getattr(response, "candidates", None):
                raise LLMServiceError(
                    "Gemini did not return any candidates. "
                    "This can happen if the request was blocked by safety filters or the prompt was invalid."
                )

            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)

            # Extract text parts safely
            parts = []
            if getattr(candidate, "content", None) and getattr(candidate.content, "parts", None):
                for part in candidate.content.parts:
                    if hasattr(part, "text") and part.text:
                        parts.append(part.text)

            if not parts:
                # As a fallback, try candidate.text if the SDK exposes it
                candidate_text = getattr(candidate, "text", None)
                if candidate_text:
                    parts.append(candidate_text)

            if not parts:
                logger.debug("No text parts found in Gemini candidate", extra={"finish_reason": finish_reason})
                raise LLMServiceError(
                    f"Gemini returned no text (finish_reason={finish_reason}). This usually means the response was blocked by safety filters or the model chose not to answer."
                )

            answer = "".join(parts)

            # Usage metadata extraction (best-effort; SDK shape may vary)
            usage_meta = getattr(response, "usage_metadata", None) or getattr(response, "usage", None)
            usage = {
                "prompt_tokens": None,
                "completion_tokens": None,
                "total_tokens": None,
            }
            if usage_meta:
                # Try several possible metadata keys, be tolerant
                usage["prompt_tokens"] = getattr(usage_meta, "prompt_token_count", None) or getattr(usage_meta, "prompt_tokens", None)
                usage["completion_tokens"] = getattr(usage_meta, "candidates_token_count", None) or getattr(usage_meta, "completion_tokens", None) or getattr(usage_meta, "candidate_tokens", None)
                usage["total_tokens"] = getattr(usage_meta, "total_token_count", None) or getattr(usage_meta, "total_tokens", None)

            logger.debug("Gemini response received", extra={"usage": usage, "finish_reason": finish_reason})

            return {
                "answer": answer,
                "model": self.model_name,
                "usage": usage,
            }

        except LLMServiceError:
            # Re-raise our own error type so callers can handle it explicitly
            raise
        except Exception as e:
            logger.exception("Gemini LLM error")
            # Wrap unknown exceptions in a clean error type
            raise LLMServiceError(f"Gemini API error: {e}")
