"""Application configuration."""
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_parse_none_str=False,
    )

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True
    secret_key: str = Field(default="change-me-in-production")

    # Database
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/insightextract"
    )
    database_echo: bool = False

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")

    # CORS
    cors_origins_str: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        alias="CORS_ORIGINS"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list."""
        return [origin.strip() for origin in self.cors_origins_str.split(",")]

    # OpenAI
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")

    # Azure OpenAI (optional)
    azure_openai_endpoint: str = Field(default="")
    azure_openai_api_key: str = Field(default="")
    azure_openai_deployment_name: str = Field(default="gpt-4")

    # Processing
    max_file_size_mb: int = 50

    # Monitoring
    sentry_dsn: str = Field(default="")
    otel_exporter_otlp_endpoint: str = Field(default="")

    @property
    def max_file_size_bytes(self) -> int:
        """Get max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
