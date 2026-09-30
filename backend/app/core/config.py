from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "Puhar Charter Advisor"
    environment: str = "development"
    database_url: str = "sqlite:///./database/puhar.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:3000"
    google_maps_api_key: str | None = None
    imd_api_key: str | None = None
    coastal_weather_api_key: str | None = None
    rate_limit_per_minute: int = 60

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
settings = get_settings()