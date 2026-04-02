"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe env var parsing.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://foundry:foundry_dev_password@localhost:5432/foundry"

    # Storage abstraction ("local" | "gcs")
    # TODO(gcp-deploy): switch to "gcs" and set GCS_BUCKET env var
    storage_backend: str = "local"
    artifact_dir: str = "./artifacts"
    gcs_bucket: str = ""

    # Job execution abstraction ("local" | "cloud_tasks")
    # TODO(gcp-deploy): switch to "cloud_tasks" and configure Cloud Tasks queue
    job_backend: str = "local"
    cloud_tasks_project_id: str = ""
    cloud_tasks_location: str = ""
    cloud_tasks_queue: str = ""
    cloud_tasks_worker_url: str = ""
    cloud_tasks_service_account_email: str = ""
    cloud_tasks_audience: str = ""

    # CORS — allow all origins in development; restrict in production
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001"

    environment: str = "development"

    @field_validator("cors_origins_str", mode="before")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_str.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
