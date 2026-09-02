import pytest
from app.utils.seed_data import generate_supply_chain_graph, PRODUCTS_CATALOG


def test_seed_data_generation_structure():
    nodes, edges = generate_supply_chain_graph(
        supplier_count=50,
        manufacturer_count=30,
        port_count=10,
        warehouse_count=15,
        distributor_count=15,
        seed=123,
    )

    assert len(nodes) > 100
    assert len(edges) > 200

    # Verify node properties
    for node in nodes:
        assert "id" in node
        assert "name" in node
        assert "label" in node
        assert "risk" in node
        assert node["risk"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert "risk_score" in node
        assert 0.0 <= node["risk_score"] <= 1.0
        assert "status" in node

    # Verify edge properties
    for edge in edges:
        assert "id" in edge
        assert "source" in edge
        assert "target" in edge
        assert "type" in edge
        assert edge["type"] in ["SUPPLIES", "MANUFACTURES", "SHIPS_TO", "STORES", "DISTRIBUTES_TO", "PRODUCES"]
        assert "lead_time_days" in edge
