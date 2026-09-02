import os
from typing import List, Union
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load .env file from root or backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def _get_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings(BaseModel):
    # Neo4j Settings
    NEO4J_URI: str = Field(default_factory=lambda: os.getenv("NEO4J_URI", "bolt://localhost:7687"))
    NEO4J_USERNAME: str = Field(default_factory=lambda: os.getenv("NEO4J_USERNAME", "neo4j"))
    NEO4J_PASSWORD: str = Field(default_factory=lambda: os.getenv("NEO4J_PASSWORD", "atmograph123"))
    NEO4J_DATABASE: str = Field(default_factory=lambda: os.getenv("NEO4J_DATABASE", "neo4j"))

    # App Settings
    PROJECT_NAME: str = "AtmoGraph - Supply Chain Ripple Effect Predictor"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "True").lower() == "true")
    API_V1_PREFIX: str = Field(default_factory=lambda: os.getenv("API_V1_PREFIX", "/api"))

    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=_get_cors_origins)

    # Graph Query Limits
    GRAPH_DEFAULT_LIMIT: int = Field(default_factory=lambda: int(os.getenv("GRAPH_DEFAULT_LIMIT", "1000")))
    GRAPH_MAX_LIMIT: int = Field(default_factory=lambda: int(os.getenv("GRAPH_MAX_LIMIT", "5000")))

    # NLP Model
    SPACY_MODEL: str = Field(default_factory=lambda: os.getenv("SPACY_MODEL", "en_core_web_sm"))


settings = Settings()
