from pathlib import Path

from pydantic_settings import BaseSettings


# Find the backend folder
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str

    class Config:
        env_file = BASE_DIR / ".env"


settings = Settings()