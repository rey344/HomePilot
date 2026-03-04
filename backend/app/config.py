"""App configuration from environment."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://homepilot:homepilot@localhost:5432/homepilot"
    cors_origins: str = "http://localhost:3000,http://localhost:9002"
    max_scenarios_per_query: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
