import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, graph, entities, risk, news
from app.core.config import settings
from app.core.database import db, Neo4jConnectionError

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("atmograph.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown events for the FastAPI application.
    Initializes database driver connection pool on startup and gracefully closes it on shutdown.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    try:
        db.connect()
    except Exception as e:
        logger.warning(f"Initial Neo4j connection attempt failed: {e}")
    
    yield

    logger.info("Shutting down AtmoGraph backend...")
    db.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## AtmoGraph – Supply Chain Ripple Effect Predictor Backend
    
    AtmoGraph is a graph-native supply-chain risk analysis platform.
    
    ### Capabilities (Week 1 & Week 2 Scope):
    * **Graph Foundations**: Neo4j-backed global supply chain graph (Suppliers, Manufacturers, Ports, Warehouses, Distributors, Products).
    * **NLP Disruption Pipeline**: spaCy Named Entity Recognition (NER), entity normalization, and disruption severity classification.
    * **Dynamic Risk Updates**: Matches disruption entities to Neo4j nodes and updates risk levels (LOW -> MEDIUM -> HIGH -> CRITICAL).
    * **Ripple Effect Engine**: Downstream risk propagation along supply-chain routes.
    * **REST APIs**: Full CRUD, summary, search, and graph querying for React frontends.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler for Neo4j Connection Issues
@app.exception_handler(Neo4jConnectionError)
async def neo4j_exception_handler(request: Request, exc: Neo4jConnectionError):
    logger.error(f"Database error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "DatabaseUnavailable",
            "message": str(exc),
            "hint": "Please verify that the Neo4j instance is running and credentials in .env are correct."
        },
    )


# Include API Routers under /api
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(graph.router, prefix=settings.API_V1_PREFIX)
app.include_router(entities.router, prefix=settings.API_V1_PREFIX)
app.include_router(risk.router, prefix=settings.API_V1_PREFIX)
app.include_router(news.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)