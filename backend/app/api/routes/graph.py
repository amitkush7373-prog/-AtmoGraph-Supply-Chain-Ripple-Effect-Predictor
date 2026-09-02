from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.config import settings
from app.core.database import Neo4jConnectionError
from app.models.graph_models import GraphResponse, GraphSummaryResponse, NodeDetailResponse
from app.services.graph_service import graph_service

router = APIRouter(tags=["Graph"])


@router.get("/graph", response_model=GraphResponse, summary="Get Paginated Graph Subnetwork")
def get_graph(
    limit: int = Query(
        default=settings.GRAPH_DEFAULT_LIMIT,
        ge=1,
        le=settings.GRAPH_MAX_LIMIT,
        description="Maximum number of nodes to return"
    ),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    type: Optional[str] = Query(None, description="Filter by node label/type (Supplier, Manufacturer, Port, Warehouse, Distributor, Product)"),
    risk: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    country: Optional[str] = Query(None, description="Filter by country name"),
    search: Optional[str] = Query(None, description="Search keyword in name or city"),
):
    """
    Returns graph nodes and connecting relationships formatted for graph visualization libraries (e.g. 2D/3D Force Graph).
    """
    try:
        return graph_service.get_graph(
            limit=limit,
            offset=offset,
            node_type=type,
            risk=risk,
            country=country,
            search=search,
        )
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying graph: {str(e)}",
        )


@router.get("/graph/summary", response_model=GraphSummaryResponse, summary="Get Overall Graph Metrics")
def get_graph_summary():
    """
    Returns high-level graph statistics: total node/edge counts, type distributions,
    risk breakdowns, and geographical distribution.
    """
    try:
        return graph_service.get_graph_summary()
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing graph summary: {str(e)}",
        )


@router.get("/graph/node/{node_id}", response_model=NodeDetailResponse, summary="Get Complete Node Details")
def get_node_detail(node_id: str):
    """
    Returns complete metadata, properties, direct incoming & outgoing connections,
    and attached disruption event history for a given node.
    """
    try:
        node = graph_service.get_node_detail(node_id)
        if node is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supply chain node with ID '{node_id}' not found in the graph."
            )
        return node
    except HTTPException:
        raise
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving node detail: {str(e)}",
        )
