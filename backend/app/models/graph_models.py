from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.risk_models import RiskLevel, RiskDistribution


class GraphNode(BaseModel):
    id: str = Field(..., description="Unique identifier for the node")
    label: str = Field(..., description="Node label/type (Supplier, Manufacturer, etc.)")
    type: Optional[str] = Field(None, description="Alias for label/type")
    name: str = Field(..., description="Display name of the entity")
    country: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    industry: Optional[str] = None
    risk: Optional[str] = Field(default="LOW", description="Qualitative risk: LOW, MEDIUM, HIGH, CRITICAL")
    risk_score: Optional[float] = Field(default=0.1, description="Numeric risk score 0.0 to 1.0")
    status: Optional[str] = Field(default="OPERATIONAL", description="Current operating status")
    risk_reason: Optional[str] = None
    updated_at: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class GraphEdge(BaseModel):
    id: str = Field(..., description="Unique edge ID")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    type: str = Field(..., description="Relationship type e.g. SUPPLIES, SHIPS_TO")
    relationship: Optional[str] = Field(None, description="Alias for type")
    lead_time_days: Optional[int] = Field(default=7, description="Estimated lead time in days")
    risk_score: Optional[float] = Field(default=0.1, description="Edge risk factor")
    status: Optional[str] = Field(default="NORMAL", description="Status of edge route")


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphEdge] = Field(..., description="List of graph relationships/links")
    total_nodes: int
    total_links: int
    limit: int
    offset: int


class GraphSummaryResponse(BaseModel):
    total_nodes: int
    total_relationships: int
    nodes_by_type: Dict[str, int]
    risk_distribution: RiskDistribution
    nodes_by_country: Dict[str, int]
    nodes_by_industry: Dict[str, int]
    recent_disruptions_count: int = 0


class ConnectedNode(BaseModel):
    id: str
    name: str
    label: str
    relationship: str
    direction: str = Field(..., description="'outgoing' or 'incoming'")
    lead_time_days: Optional[int] = None
    risk: Optional[str] = None
    risk_score: Optional[float] = None
    status: Optional[str] = None


class DisruptionEventSummary(BaseModel):
    id: str
    title: Optional[str] = None
    severity: str
    timestamp: str
    risk_delta: Optional[float] = None


class NodeDetailResponse(BaseModel):
    id: str
    name: str
    label: str
    type: str
    country: Optional[str] = None
    city: Optional[str] = None
    industry: Optional[str] = None
    risk: str
    risk_score: float
    status: str
    risk_reason: Optional[str] = None
    updated_at: Optional[str] = None
    incoming_connections: List[ConnectedNode] = Field(default_factory=list)
    outgoing_connections: List[ConnectedNode] = Field(default_factory=list)
    total_connections: int = 0
    recent_disruptions: List[DisruptionEventSummary] = Field(default_factory=list)
