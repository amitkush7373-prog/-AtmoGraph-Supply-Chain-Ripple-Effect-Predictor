import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.models.gnn_models import (
    GNNModelMetrics,
    GNNPredictRequest,
    GNNPredictResponse,
    GNNTrainResponse,
)
from app.services.gnn_service import gnn_service
from app.services.gnn_training import train_gnn_model

logger = logging.getLogger("atmograph.api.gnn")

router = APIRouter(prefix="/gnn", tags=["Graph Neural Network (GNN)"])

PRESET_SCENARIOS = {
    "news_rotterdam": {
        "id": "news_rotterdam",
        "title": "Port of Rotterdam Dock Strike",
        "epicenter_node_ids": ["PRT_0001"],
        "severity": "CRITICAL",
        "headline": "Major port strike halts operations at Port of Rotterdam",
    },
    "news_taiwan": {
        "id": "news_taiwan",
        "title": "Taiwan Semiconductor Fab Outage",
        "epicenter_node_ids": ["MAN_01453"],
        "severity": "HIGH",
        "headline": "Taiwan semiconductor fab reports production disruption",
    },
    "news_suez": {
        "id": "news_suez",
        "title": "Suez Canal Container Vessel Grounding",
        "epicenter_node_ids": ["HUB_SUEZ"],
        "severity": "HIGH",
        "headline": "Suez Canal traffic restricted due to vessel grounding",
    },
    "news_congo": {
        "id": "news_congo",
        "title": "DRC Cobalt Export Quota Restrictions",
        "epicenter_node_ids": ["RAW_COBALT"],
        "severity": "MEDIUM",
        "headline": "Cobalt prices surge amid Congo export restrictions",
    },
    "news_shanghai": {
        "id": "news_shanghai",
        "title": "Port of Shanghai Typhoon Berthing Backlog",
        "epicenter_node_ids": ["PRT_0004"],
        "severity": "MEDIUM",
        "headline": "Port of Shanghai congestion reaches 3-week high",
    },
}


@router.post(
    "/predict",
    response_model=GNNPredictResponse,
    summary="Predict Downstream Delays & Risk via GNN Node Regression",
    description="""
    Feeds upstream disruption features (epicenters, severity, news text) into the trained
    3-Layer GraphSAGE model to predict continuous downstream delay (days) and risk scores
    for all impacted network facilities.
    """,
)
def predict_delays(request: GNNPredictRequest) -> GNNPredictResponse:
    try:
        return gnn_service.predict(request)
    except Exception as e:
        logger.error(f"GNN prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GNN inference error: {str(e)}",
        )


@router.get(
    "/metrics",
    response_model=GNNModelMetrics,
    summary="Get GNN Model Architecture & Benchmark Metrics",
    description="Returns validation MAE, RMSE, R² score, layer structure, and training metadata.",
)
def get_model_metrics() -> GNNModelMetrics:
    try:
        return gnn_service.get_metrics()
    except Exception as e:
        logger.error(f"Failed to fetch GNN metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve GNN model metrics: {str(e)}",
        )


@router.get(
    "/presets",
    summary="List Preconfigured GNN Disruption Scenarios",
)
def list_presets():
    return list(PRESET_SCENARIOS.values())


@router.get(
    "/preset/{preset_id}",
    response_model=GNNPredictResponse,
    summary="Run GNN Prediction on Preset Disruption Scenario",
)
def predict_preset(preset_id: str) -> GNNPredictResponse:
    preset = PRESET_SCENARIOS.get(preset_id)
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset '{preset_id}' not found. Available: {list(PRESET_SCENARIOS.keys())}",
        )
    req = GNNPredictRequest(
        epicenter_node_ids=preset["epicenter_node_ids"],
        severity=preset["severity"],
    )
    return gnn_service.predict(req)


@router.post(
    "/train",
    response_model=GNNTrainResponse,
    summary="Retrain SupplyChainGNN Model",
    description="Triggers training loop across synthetic multi-tier disruption scenarios.",
)
def retrain_model(
    epochs: int = Query(default=50, ge=10, le=200),
    scenarios: int = Query(default=300, ge=50, le=1000),
) -> GNNTrainResponse:
    try:
        model, metrics = train_gnn_model(epochs=epochs, num_scenarios=scenarios)
        gnn_service._initialize_model()
        return GNNTrainResponse(
            status="success",
            message=f"Model successfully trained for {epochs} epochs over {scenarios} scenarios.",
            metrics=gnn_service.get_metrics(),
        )
    except Exception as e:
        logger.error(f"GNN training failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GNN training failed: {str(e)}",
        )
