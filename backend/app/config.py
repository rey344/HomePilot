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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        """Validate critical settings at startup."""
        super().__init__(**kwargs)
        
        # Fail fast if DATABASE_URL looks like a placeholder or is insecure
        if not self.database_url:
            print("❌ FATAL: DATABASE_URL is required but not set.", file=sys.stderr)
            print("   Set it via environment variable or .env file.", file=sys.stderr)
            print("   For local dev: cp infrastructure/.env.example infrastructure/.env", file=sys.stderr)
            sys.exit(1)
        
        # Warn about insecure patterns (but allow for backward compatibility)
        insecure_patterns = ["CHANGE_ME", "changeme", "homepilot:homepilot", ":memory:"]
        for pattern in insecure_patterns:
            if pattern in self.database_url and ":memory:" not in self.database_url:
                print(f"⚠️  WARNING: DATABASE_URL contains '{pattern}' - this is insecure for production!", file=sys.stderr)


settings = Settings()
