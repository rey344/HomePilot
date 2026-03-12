"""App configuration from environment with security-first defaults.

SECURITY NOTES:
- DATABASE_URL is REQUIRED (no insecure defaults)
- Tests explicitly set DATABASE_URL=sqlite:///:memory: in conftest.py
- Production MUST provide DATABASE_URL via environment or .env file
- Local dev should use infrastructure/.env (never committed)
"""
import os
import sys
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:3000,http://localhost:9002"
    max_scenarios_per_query: int = 100
    rapidapi_key: str = ""
    fred_api_key: str = ""  # For real-time mortgage rates
    
    # Groq AI Configuration
    # Set GROQ_API_KEY to enable real AI (FREE, fast Llama models)
    # Leave empty to use rule-based mock responses
    groq_api_key: str = ""
    ai_provider: str = "groq"  # "groq" or "mock"
    ai_model: str = "llama-3.3-70b-versatile"  # Groq model
    ai_temperature: float = 0.7  # 0.0-1.0, lower = more deterministic
    ai_max_tokens: int = 500  # Max tokens in AI response
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        """Validate critical settings at startup."""
        super().__init__(**kwargs)
        
        # Fail fast if DATABASE_URL looks like a placeholder or is insecure
        if not self.database_url:
            print("FATAL: DATABASE_URL is required but not set.", file=sys.stderr)
            print("Set it via environment variable or .env file.", file=sys.stderr)
            print("For local dev: cp infrastructure/.env.example infrastructure/.env", file=sys.stderr)
            sys.exit(1)

        insecure_patterns = ["CHANGE_ME", "changeme", "homepilot:homepilot"]
        for pattern in insecure_patterns:
            if pattern in self.database_url:
                print(f"WARNING: DATABASE_URL contains '{pattern}' — do not use in production.", file=sys.stderr)


settings = Settings()
