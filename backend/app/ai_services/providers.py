"""
AI Provider abstraction layer supporting multiple LLM APIs.
Supports: OpenAI, Groq, Anthropic with automatic fallback to mock.
"""
import sys
from typing import Optional
from dataclasses import dataclass
from app.config import settings


@dataclass
class AIResponse:
    """Standardized AI response."""
    content: str
    provider: str  # "openai", "groq", "anthropic", "mock"
    model: str
    tokens_used: int = 0


class AIProvider:
    """Base class for AI providers."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model
        self.provider_name = "base"
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        """Generate response from AI provider."""
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    """OpenAI GPT provider."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        super().__init__(api_key, model or "gpt-4o-mini")
        self.provider_name = "openai"
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
        except ImportError:
            print("⚠️  OpenAI package not installed. Run: pip install openai", file=sys.stderr)
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
                provider="openai",
                model=self.model,
                tokens_used=response.usage.total_tokens,
            )
        except Exception as e:
            print(f"❌ OpenAI API error: {e}", file=sys.stderr)
            raise


class GroqProvider(AIProvider):
    """Groq (fast Llama inference) provider."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        super().__init__(api_key, model or "llama-3.3-70b-versatile")
        self.provider_name = "groq"
        try:
            from groq import Groq
            self.client = Groq(api_key=api_key)
        except ImportError:
            print("⚠️  Groq package not installed. Run: pip install groq", file=sys.stderr)
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
            print(f"❌ Groq API error: {e}", file=sys.stderr)
            raise


class AnthropicProvider(AIProvider):
    """Anthropic Claude provider."""
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        super().__init__(api_key, model or "claude-3-5-haiku-20241022")
        self.provider_name = "anthropic"
        try:
            from anthropic import Anthropic
            self.client = Anthropic(api_key=api_key)
        except ImportError:
            print("⚠️  Anthropic package not installed. Run: pip install anthropic", file=sys.stderr)
            raise
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system="You are a financial advisor helping people understand homebuying affordability and mortgage calculations. Provide clear, concise, and actionable advice.",
                messages=[
                    {"role": "user", "content": prompt}
                ],
            )
            return AIResponse(
                content=response.content[0].text,
                provider="anthropic",
                model=self.model,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            )
        except Exception as e:
            print(f"❌ Anthropic API error: {e}", file=sys.stderr)
            raise


class MockProvider(AIProvider):
    """Mock provider using rule-based responses (fallback when no API keys set)."""
    
    def __init__(self):
        super().__init__("", "mock-v1")
        self.provider_name = "mock"
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 500) -> AIResponse:
        # Simple rule-based response
        content = (
            "This is a rule-based explanation (no AI provider configured). "
            "Set GROQ_API_KEY or OPENAI_API_KEY environment variable to enable real AI responses."
        )
        return AIResponse(
            content=content,
            provider="mock",
            model="rule-based",
            tokens_used=0,
        )


def get_ai_provider() -> AIProvider:
    """
    Get the configured AI provider with automatic fallback.
    
    Priority (when ai_provider="auto"):
    1. Groq (free, fast)
    2. OpenAI (excellent quality)
    3. Anthropic (excellent quality)
    4. Mock (rule-based fallback)
    
    Returns configured provider or MockProvider if no API keys set.
    """
    provider_name = settings.ai_provider.lower()
    
    # Explicit provider selection
    if provider_name == "openai" and settings.openai_api_key:
        print(f"🤖 Using OpenAI provider: {settings.ai_model or 'gpt-4o-mini'}")
        return OpenAIProvider(settings.openai_api_key, settings.ai_model if settings.ai_model != "auto" else None)
    
    if provider_name == "groq" and settings.groq_api_key:
        print(f"🤖 Using Groq provider: {settings.ai_model or 'llama-3.3-70b-versatile'}")
        return GroqProvider(settings.groq_api_key, settings.ai_model if settings.ai_model != "auto" else None)
    
    if provider_name == "anthropic" and settings.anthropic_api_key:
        print(f"🤖 Using Anthropic provider: {settings.ai_model or 'claude-3-5-haiku-20241022'}")
        return AnthropicProvider(settings.anthropic_api_key, settings.ai_model if settings.ai_model != "auto" else None)
    
    if provider_name == "mock":
        print("🤖 Using mock provider (rule-based responses)")
        return MockProvider()
    
    # Auto mode - try providers in priority order
    if provider_name == "auto":
        # Try Groq first (free, fast)
        if settings.groq_api_key:
            print("🤖 Auto-selected Groq provider (free, fast)")
            return GroqProvider(settings.groq_api_key, settings.ai_model if settings.ai_model != "auto" else None)
        
        # Try OpenAI second
        if settings.openai_api_key:
            print("🤖 Auto-selected OpenAI provider")
            return OpenAIProvider(settings.openai_api_key, settings.ai_model if settings.ai_model != "auto" else None)
        
        # Try Anthropic third
        if settings.anthropic_api_key:
            print("🤖 Auto-selected Anthropic provider")
            return AnthropicProvider(settings.anthropic_api_key, settings.ai_model if settings.ai_model != "auto" else None)
    
    # Fallback to mock
    print("⚠️  No AI provider configured. Using rule-based mock. Set GROQ_API_KEY or OPENAI_API_KEY to enable AI.", file=sys.stderr)
    return MockProvider()
