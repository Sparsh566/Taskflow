import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TaskFlow"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-taskflow-jwt-local-signing-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # SQLite by default for simple dev zero-dependency, switchable to PostgreSQL
    DATABASE_URL: str = "sqlite:///./taskflow.db"

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # GitHub integration
    GITHUB_API_BASE_URL: str = "https://api.github.com"
    GITHUB_DEFAULT_TOKEN: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
