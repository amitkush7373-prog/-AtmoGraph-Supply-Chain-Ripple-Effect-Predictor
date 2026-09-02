from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.database import Neo4jConnectionError
from app.models.news_models import (
    DisruptionEventDetail, NewsAnalyzeRequest, NewsAnalyzeResponse
)
from app.services.risk_service import risk_service

router = APIRouter(tags=["News & Disruption Pipeline"])


@router.post("/news/analyze", response_model=NewsAnalyzeResponse, summary="Analyze News & Propagate Disruption")
def analyze_news_disruption(payload: NewsAnalyzeRequest):
    """
    **End-to-End Week 2 NLP & Disruption Pipeline**:
    1. Ingests raw news article / disruption text.
    2. Runs Named Entity Recognition (spaCy NER) to detect locations, organizations, and facilities.
    3. Normalizes entities and extracts disruption severity keywords.
    4. Matches extracted entities against supply chain graph nodes in Neo4j.
    5. Calculates dynamic risk transitions (LOW -> MEDIUM -> HIGH -> CRITICAL).
    6. Persists risk updates to matched nodes in Neo4j.
    7. Creates a linked `DisruptionEvent` node in the graph.
    8. Automatically calculates and updates downstream supply chain ripple effects.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Disruption text cannot be empty."
        )

    try:
        return risk_service.process_news_disruption(
            text=payload.text,
            severity_override=payload.severity_override,
            propagate_ripple=payload.propagate_ripple,
        )
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing news disruption: {str(e)}",
        )


@router.get("/news/events", summary="List Historical Disruption Events")
def get_disruption_events(
    limit: int = Query(default=20, ge=1, le=100, description="Max events to return")
):
    """
    Returns recorded historical disruption events and their impacted node counts.
    """
    try:
        events = risk_service.get_recent_disruptions(limit=limit)
        return {
            "total": len(events),
            "events": events,
        }
    except Neo4jConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching disruption events: {str(e)}",
        )
