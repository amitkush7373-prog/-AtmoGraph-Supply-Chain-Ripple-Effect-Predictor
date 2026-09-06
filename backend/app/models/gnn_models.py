from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class GNNPredictRequest(BaseModel):
    epicenter_node_ids: Optional[List[str]] = Field(
        default=None,
        description="List of node IDs directly experiencing upstream disruption (e.g. ['PRT_0001'])",
    )
    severity: Optional[str] = Field(
        default="HIGH",
        description="Disruption severity level: CRITICAL, HIGH, MEDIUM, LOW",
    )
    text: Optional[str] = Field(
        default=None,
        description="Optional news text to extract epicenters and severity via NLP",
    )
    delay_threshold: Optional[float] = Field(
        default=3.0,
        description="Threshold in days to flag a node as 'at-risk'",
    )


class GNNNodePrediction(BaseModel):
    id: str
    name: str
    type: str
    predicted_delay_days: float
    predicted_risk_score: float
    previous_risk_score: float
    is_at_risk: bool
    risk_level: str
    hops_from_disruption: int
    contributing_epicenter: Optional[str] = None
    explanation: str


class GNNPredictResponse(BaseModel):
    epicenter_node_ids: List[str]
    severity: str
    severity_score: float
    total_at_risk_nodes: int
    max_delay_days: float
    avg_delay_days: float
    confidence: float
    inference_time_ms: float
    node_predictions: List[GNNNodePrediction]
    timestamp: str


class GNNModelMetrics(BaseModel):
    model_name: str
    architecture: str
    layers: int
    hidden_dim: int
    mae_days: float
    rmse_days: float
    r2_score: float
    at_risk_accuracy: float
    total_training_scenarios: int
    trained_at: str
    status: str


class GNNTrainResponse(BaseModel):
    status: str
    message: str
    metrics: GNNModelMetrics
