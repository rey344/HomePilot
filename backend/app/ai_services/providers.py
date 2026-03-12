"""
AI Provider abstraction layer using Groq (free, fast Llama models).
Supports: Groq with automatic fallback to mock.
"""
import logging
from typing import Optional
from dataclasses import dataclass
from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    """Standardized AI response."""
    content: str
    provider: str  # "groq" or "mock"
    model: str
    tokens_used: int = 0


class AIProvider:
    """Base class for AI providers."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model
        self.provider_name = "base"
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        """Generate response from a single user prompt (system prompt may be fixed)."""
        raise NotImplementedError
    
    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.6,
        max_tokens: int = 600,
    ) -> AIResponse:
        """Multi-turn chat: messages is a list of {"role": "system"|"user"|"assistant", "content": "..."}."""
        raise NotImplementedError


class GroqProvider(AIProvider):
    """Groq (fast Llama inference) provider."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        super().__init__(api_key, model or "llama-3.3-70b-versatile")
        self.provider_name = "groq"
        try:
            from groq import Groq
            self.client = Groq(api_key=api_key)
        except ImportError:
            logger.error("groq package not installed; run: pip install groq")
            raise
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial advisor helping people understand homebuying affordability and mortgage calculations. Provide clear, concise, and actionable advice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return AIResponse(
                content=response.choices[0].message.content,
                provider="groq",
                model=self.model,
                tokens_used=response.usage.total_tokens,
            )
        except Exception as e:
            logger.error("Groq API error: %s", e)
            return MockProvider().generate(prompt, temperature, max_tokens)

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.6,
        max_tokens: int = 600,
    ) -> AIResponse:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return AIResponse(
                content=response.choices[0].message.content or "",
                provider="groq",
                model=self.model,
                tokens_used=response.usage.total_tokens,
            )
        except Exception as e:
            logger.error("Groq chat error: %s", e)
            return AIResponse(
                content="I couldn’t process that right now. Please try again.",
                provider="mock",
                model="fallback",
                tokens_used=0,
            )


class MockProvider(AIProvider):
    """Mock provider using rule-based responses (fallback when no API key set)."""
    
    def __init__(self):
        super().__init__("", "mock-v1")
        self.provider_name = "mock"
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        content = (
            "This is a rule-based explanation (Groq API not configured). "
            "Set GROQ_API_KEY environment variable to enable real AI responses with Groq's free Llama models."
        )
        return AIResponse(
            content=content,
            provider="mock",
            model="rule-based",
            tokens_used=0,
        )

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.6,
        max_tokens: int = 600,
    ) -> AIResponse:
        return AIResponse(
            content="Chat is available when GROQ_API_KEY is set. I’d then use your scenario to answer questions.",
            provider="mock",
            model="rule-based",
            tokens_used=0,
        )


def get_ai_provider() -> AIProvider:
    """
    Get the configured AI provider with automatic fallback.
    
    Uses Groq (free, fast Llama models) if GROQ_API_KEY is set,
    otherwise falls back to MockProvider (rule-based responses).
    
    Returns configured provider or MockProvider if no API key set.
    """
    provider_name = settings.ai_provider.lower()

    if provider_name == "groq" and settings.groq_api_key:
        logger.info("Using Groq provider: %s", settings.ai_model)
        return GroqProvider(settings.groq_api_key, settings.ai_model)

    if provider_name == "mock":
        logger.info("Using mock AI provider (rule-based responses)")
        return MockProvider()

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set; falling back to rule-based mock responses")
        return MockProvider()

    logger.info("Using Groq provider: %s", settings.ai_model)
    return GroqProvider(settings.groq_api_key, settings.ai_model)
