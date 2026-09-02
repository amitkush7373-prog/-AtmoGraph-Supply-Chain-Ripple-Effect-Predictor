from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NodeStatus(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    DELAYED = "DELAYED"
    DISRUPTED = "DISRUPTED"
    CONGESTED = "CONGESTED"
    HALTED = "HALTED"
    MONITORING = "MONITORING"


class RiskDistribution(BaseModel):
    LOW: int = Field(default=0, description="Count of LOW risk nodes")
    MEDIUM: int = Field(default=0, description="Count of MEDIUM risk nodes")
    HIGH: int = Field(default=0, description="Count of HIGH risk nodes")
    CRITICAL: int = Field(default=0, description="Count of CRITICAL risk nodes")


class RiskSummaryResponse(BaseModel):
    total_nodes: int = Field(..., description="Total nodes evaluated")
    risk_distribution: RiskDistribution
    average_risk_score: float = Field(..., description="Average risk score between 0.0 and 1.0")
    highest_risk_regions: Dict[str, int] = Field(default_factory=dict, description="Region to high/critical count")
    highest_risk_industries: Dict[str, int] = Field(default_factory=dict, description="Industry to high/critical count")


class RiskNodeItem(BaseModel):
    id: str
    name: str
    type: str
    country: Optional[str] = None
    city: Optional[str] = None
    industry: Optional[str] = None
    risk: RiskLevel
    risk_score: float
    status: Optional[str] = None
    risk_reason: Optional[str] = None
    updated_at: Optional[str] = None


class RiskNodesResponse(BaseModel):
    level: Optional[RiskLevel] = None
    total: int
    limit: int
    offset: int
    nodes: List[RiskNodeItem]


class NodeRiskUpdate(BaseModel):
    id: str
    name: str
    type: str
    previous_risk: RiskLevel
    new_risk: RiskLevel
    previous_score: float
    new_score: float
    status: NodeStatus
    risk_reason: str
    country: Optional[str] = None
    city: Optional[str] = None
