from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.database import Neo4jConnectionError
from app.models.risk_models import RiskLevel, RiskNodesResponse, RiskSummaryResponse
from app.services.graph_service import graph_service

router = APIRouter(tags=["Risk"])


@router.get("/risk/summary", response_model=RiskSummaryResponse, summary="Get Global Risk Summary and Distributions")
def get_risk_summary():
    """
    Returns counts of nodes across risk levels (LOW, MEDIUM, HIGH, CRITICAL),
    overall average network risk score, and highest risk geographic regions and industries.
    """
    try:
        return graph_service.get_risk_summary()
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing risk summary: {str(e)}",
        )


@router.get("/risk/nodes", response_model=RiskNodesResponse, summary="Get Nodes Filtered by Risk Level")
def get_risk_nodes(
    level: Optional[RiskLevel] = Query(None, description="Filter nodes by risk tier (LOW, MEDIUM, HIGH, CRITICAL)"),
    limit: int = Query(default=50, ge=1, le=500, description="Items per page"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
):
    """
    Retrieves a sorted list of nodes filtered by risk level, ordered from highest to lowest risk score.
    """
    try:
        return graph_service.get_risk_nodes(
            level=level,
            limit=limit,
            offset=offset,
        )
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching risk nodes: {str(e)}",
        )
