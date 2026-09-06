from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import db

router = APIRouter(tags=["Health"])


@router.get("/health", summary="System and Database Health Check")
def health_check():
    """
    Returns the real connection status to Neo4j.
    If Neo4j is offline or unreachable, returns 503 Service Unavailable.
    """
    is_neo4j_alive = db.is_connected()
    
    if is_neo4j_alive:
        return {
            "status": "ok",
            "neo4j": "connected",
            "database": settings.NEO4J_DATABASE,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }
    else:
        return {
            "status": "degraded",
            "neo4j": "disconnected",
            "message": f"Neo4j database offline at {settings.NEO4J_URI}. Operating in graph dataset mode.",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }
