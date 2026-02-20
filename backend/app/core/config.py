"""Application configuration with HIPAA compliance settings."""
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Medical Assistant"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database - SQLite default, PostgreSQL ready
    DATABASE_TYPE: str = "sqlite"  # "sqlite" or "postgresql"
    DATABASE_URL: str = "sqlite+aiosqlite:///./med_assistant.db"
    POSTGRES_URL: Optional[str] = None  # For future PostgreSQL migration
    
    # Security - HIPAA Compliance
    SECRET_KEY: str = "CHANGE-THIS-IN-PRODUCTION-USE-STRONG-KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Encryption for PHI data at rest
    ENCRYPTION_KEY: Optional[str] = None  # Fernet key for encrypting sensitive data
    
    # LLM Configuration
    LLM_PROVIDER: str = "local"  # "gcp" or "local"
    
    # GCP MedGemma / Vertex AI settings
    GCP_PROJECT_ID: str = "977337325460"
    GCP_LOCATION: str = "us-central1"
    GCP_ENDPOINT_ID: str = "mg-endpoint-1f3addd2-8e87-4fcd-a6e2-019ff94fce3e"
    GCP_API_ENDPOINT: str = "us-central1-aiplatform.googleapis.com"
    GCP_DEDICATED_ENDPOINT: Optional[str] = None  # For dedicated endpoints
    GOOGLE_API_KEY: Optional[str] = None
    
    # Local LLM settings (e.g., Ollama, LM Studio)
    LOCAL_LLM_URL: str = "http://localhost:11434"  # Ollama default
    LOCAL_LLM_MODEL: str = "llama2"  # or any medical-tuned model
    
    # Health Data Integration
    APPLE_HEALTH_ENABLED: bool = False
    
    # Family member limits
    MAX_FAMILY_MEMBERS: int = 6
    
    # HIPAA Audit logging
    AUDIT_LOG_ENABLED: bool = True
    AUDIT_LOG_PATH: str = "./logs/audit.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
