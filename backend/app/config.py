"""App configuration from environment."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://homepilot:homepilot@localhost:5432/homepilot"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
