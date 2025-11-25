"""
Jal Jeevan Mission - Configuration Management
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List, Union
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "Jal Jeevan Mission Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "jal_jeevan_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_PASSWORD:
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        else:
            return f"postgresql://{self.DB_USER}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # MQTT Broker
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: Optional[str] = "jjm_user"
    MQTT_PASSWORD: Optional[str] = "jjm_secure_password"
    MQTT_KEEPALIVE: int = 60
    MQTT_QOS: int = 1
    MQTT_TOPICS: List[str] = [
        "jjm/sensors/+/data",
        "jjm/sensors/+/status",
        "jjm/alerts/#"
    ]

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 1000

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS - can be string or list
    CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from string or list"""
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            # If comma-separated string, split it
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    # ML Model
    ML_MODEL_PATH: str = "ml/models"
    ML_ANOMALY_THRESHOLD: float = 0.5
    ML_PREDICTION_INTERVAL: int = 60  # seconds

    # Data Retention
    SENSOR_READING_RETENTION_DAYS: int = 90
    AUDIT_LOG_RETENTION_DAYS: int = 365

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/jjm_platform.log"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env

settings = Settings()
