import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "AtmoGraph" in data["service"]


def test_health_endpoint_response_structure():
    response = client.get("/api/health")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    assert "neo4j" in data


def test_empty_news_analyze_fails_validation():
    response = client.post("/api/news/analyze", json={"text": ""})
    assert response.status_code == 422  # Pydantic validation error


def test_news_analyze_nlp_processing():
    payload = {
        "text": "Due to a major port strike in Rotterdam, shipments from European electronics suppliers are expected to experience delays.",
        "propagate_ripple": False,
    }
    response = client.post("/api/news/analyze", json=payload)
    # Either 200 (if DB connected/handled) or 503 (if DB offline)
    if response.status_code == 200:
        data = response.json()
        assert "entities" in data
        assert "severity" in data
        assert data["severity"] in ["HIGH", "CRITICAL"]
    else:
        assert response.status_code in [500, 503]
