from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.risk_models import NodeRiskUpdate, RiskLevel


class NewsAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Raw news article or disruption alert text", examples=["Due to a major port strike in Rotterdam, shipments from European electronics suppliers are expected to experience delays."])
    severity_override: Optional[RiskLevel] = Field(None, description="Optional manual override for disruption severity")
    propagate_ripple: bool = Field(default=True, description="Whether to compute and apply downstream ripple effects")


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Entity text as found in news")
    label: str = Field(..., description="NER label e.g. GPE, LOC, ORG, FAC, PRODUCT, EVENT")
    start: int = Field(..., description="Character start index")
    end: int = Field(..., description="Character end index")
    normalized: str = Field(..., description="Normalized lookup string")


class MatchedNode(BaseModel):
    id: str
    name: str
    label: str
    type: str
    country: Optional[str] = None
    city: Optional[str] = None
    match_type: str = Field(..., description="How entity matched: 'city_match', 'country_match', 'name_match', 'alias_match'")
    confidence: float = Field(..., description="Match confidence score between 0.0 and 1.0")


class RippleEffectItem(BaseModel):
    id: str
    name: str
    label: str
    type: str
    parent_id: str
    parent_name: str
    relationship: str
    previous_risk: str
    new_risk: str
    previous_score: float
    new_score: float
    impact_reason: str


class NewsAnalyzeResponse(BaseModel):
    text: str
    entities: List[ExtractedEntity]
    severity: str
    severity_score: float
    matched_keywords: List[str]
    matched_nodes: List[MatchedNode]
    risk_updates: List[NodeRiskUpdate]
    ripple_effects: List[RippleEffectItem] = Field(default_factory=list)
    disruption_event_id: Optional[str] = None
    timestamp: str
    message: str


class DisruptionEventDetail(BaseModel):
    id: str
    title: Optional[str] = None
    text: str
    severity: str
    severity_score: float
    matched_keywords: List[str]
    detected_entities: List[str]
    affected_nodes_count: int
    timestamp: str
