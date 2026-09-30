from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
DATABASE_DIR = ROOT_DIR / "database"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    app_name: str = "Puhar Charter Advisor"
    environment: str = "development"
    database_url: str = f"sqlite:///{(DATABASE_DIR / 'puhar.db').as_posix()}"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    frontend_origin: str = "http://localhost:5173"
    google_maps_api_key: str | None = None
    imd_api_key: str | None = None
    coastal_weather_api_key: str | None = None
    rate_limit_per_minute: int = 60

    @model_validator(mode="after")
    def resolve_database_url(self) -> "Settings":
        prefix = "sqlite:///./"
        if self.database_url.startswith(prefix):
            relative = self.database_url[len(prefix) :]
            object.__setattr__(self, "database_url", f"sqlite:///{(ROOT_DIR / relative).as_posix()}")
        elif self.database_url.startswith("postgres://"):
            object.__setattr__(self, "database_url", self.database_url.replace("postgres://", "postgresql+psycopg://", 1))
        elif self.database_url.startswith("postgresql://") and "+psycopg" not in self.database_url:
            object.__setattr__(self, "database_url", self.database_url.replace("postgresql://", "postgresql+psycopg://", 1))
        return self


    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.frontend_origin and self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins


@lru_cache
def get_settings() -> Settings:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()


settings = get_settings()
