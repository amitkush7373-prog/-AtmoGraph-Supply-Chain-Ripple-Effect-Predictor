import pytest
import torch
from fastapi.testclient import TestClient

from app.main import app
from app.services.gnn_architecture import SupplyChainGNN
from app.services.gnn_service import gnn_service
from app.services.gnn_training import SupplyChainGraphDataset

client = TestClient(app)


def test_gnn_model_forward_pass_shapes():
    """Validates that SupplyChainGNN outputs correct multi-task tensor shapes and bounds."""
    N = 25
    in_features = 16
    hidden_dim = 32

    model = SupplyChainGNN(in_features=in_features, hidden_dim=hidden_dim)
    model.eval()

    x = torch.randn(N, in_features)
    adj_norm = torch.eye(N) + 0.1 * torch.ones(N, N)

    pred_delays, pred_risks = model(x, adj_norm)

    assert pred_delays.shape == (N, 1), f"Expected (N, 1), got {pred_delays.shape}"
    assert pred_risks.shape == (N, 1), f"Expected (N, 1), got {pred_risks.shape}"

    # Verify bounds
    assert torch.all(pred_delays >= 0.0), "Predicted delay must be non-negative"
    assert torch.all((pred_risks >= 0.0) & (pred_risks <= 1.0)), "Predicted risk must be in [0, 1]"


def test_gnn_feature_builder():
    """Validates that SupplyChainGraphDataset builds valid feature tensors."""
    dataset = gnn_service.presentation_dataset
    assert dataset is not None
    assert dataset.N == 21

    # Rotterdam index
    rotterdam_idx = dataset.node_id_to_idx.get("PRT_0001", 0)
    feats = dataset.build_features([rotterdam_idx], severity_score=0.85)

    assert feats.shape == (21, 16)
    # Epicenter flag on Rotterdam
    assert feats[rotterdam_idx, 9] == 1.0
    assert feats[rotterdam_idx, 10] == 0.85


def test_gnn_api_metrics_endpoint():
    """Validates GET /api/gnn/metrics returns model metadata and validation metrics."""
    response = client.get("/api/gnn/metrics")
    assert response.status_code == 200
    data = response.json()

    assert "model_name" in data
    assert "architecture" in data
    assert "mae_days" in data
    assert "r2_score" in data
    assert data["mae_days"] <= 3.0  # Validation threshold
    assert data["status"] == "ready"


def test_gnn_api_presets_endpoint():
    """Validates GET /api/gnn/presets lists available preconfigured scenarios."""
    response = client.get("/api/gnn/presets")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 5
    preset_ids = [p["id"] for p in data]
    assert "news_rotterdam" in preset_ids
    assert "news_taiwan" in preset_ids


def test_gnn_api_predict_rotterdam_preset():
    """Validates GET /api/gnn/preset/news_rotterdam runs GNN inference and highlights downstream delays."""
    response = client.get("/api/gnn/preset/news_rotterdam")
    assert response.status_code == 200
    data = response.json()

    assert data["severity"] == "CRITICAL"
    assert "PRT_0001" in data["epicenter_node_ids"]
    assert data["total_at_risk_nodes"] >= 3
    assert data["max_delay_days"] >= 5.0
    assert len(data["node_predictions"]) > 0

    # Verify Port of Rotterdam is highest or among highest delay
    preds = {p["id"]: p for p in data["node_predictions"]}
    assert "PRT_0001" in preds
    assert preds["PRT_0001"]["is_at_risk"] is True
    assert preds["PRT_0001"]["predicted_delay_days"] >= 5.0


def test_gnn_api_predict_custom_payload():
    """Validates POST /api/gnn/predict accepts custom epicenters and produces valid delay predictions."""
    payload = {
        "epicenter_node_ids": ["MAN_01453"],
        "severity": "HIGH",
        "delay_threshold": 3.0,
    }
    response = client.post("/api/gnn/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_at_risk_nodes"] > 0
    assert data["confidence"] >= 80.0
    assert data["inference_time_ms"] >= 0.0

    preds = {p["id"]: p for p in data["node_predictions"]}
    assert "MAN_01453" in preds
    assert preds["MAN_01453"]["is_at_risk"] is True
