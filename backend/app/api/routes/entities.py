from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.database import Neo4jConnectionError
from app.models.graph_models import GraphNode, NodeDetailResponse
from app.services.graph_service import graph_service

router = APIRouter(tags=["Entities"])


@router.get("/entities", summary="Search and Filter Supply Chain Entities")
def list_entities(
    q: Optional[str] = Query(None, description="Search keyword matching name, city, or country"),
    type: Optional[str] = Query(None, description="Entity type: Supplier, Manufacturer, Port, Warehouse, Distributor, Product"),
    country: Optional[str] = Query(None, description="Filter by country"),
    risk: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    limit: int = Query(default=50, ge=1, le=500, description="Items per page"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
):
    """
    Search and filter supply chain entities for frontend directory, search bar, and inspection panels.
    """
    try:
        res = graph_service.get_graph(
            limit=limit,
            offset=offset,
            node_type=type,
            risk=risk,
            country=country,
            search=q,
        )
        return {
            "total": res.total_nodes,
            "limit": limit,
            "offset": offset,
            "items": res.nodes,
        }
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing entities: {str(e)}",
        )


@router.get("/entities/{node_id}", response_model=NodeDetailResponse, summary="Get Specific Entity Details")
def get_entity_by_id(node_id: str):
    """
    Returns full entity metadata and connected network topology.
    """
    try:
        node = graph_service.get_node_detail(node_id)
        if node is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity '{node_id}' not found."
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
            detail=f"Error retrieving entity: {str(e)}",
        )
