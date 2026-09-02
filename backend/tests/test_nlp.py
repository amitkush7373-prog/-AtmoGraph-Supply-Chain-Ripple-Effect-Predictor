import pytest
from app.services.ner_service import ner_service


def test_ner_extraction_rotterdam():
    text = "Due to a major port strike in Rotterdam, shipments from European electronics suppliers are expected to experience delays."
    entities = ner_service.extract_entities(text)
    
    assert len(entities) >= 1
    entity_texts = [e.text for e in entities]
    assert "Rotterdam" in entity_texts

    severity, score, bump, keywords = ner_service.analyze_severity(text)
    assert severity in ["HIGH", "CRITICAL"]
    assert "strike" in keywords
    assert bump >= 0.30


def test_ner_extraction_shanghai_typhoon():
    text = "A catastrophic typhoon has forced the closure and shutdown of container terminals in Shanghai and Ningbo-Zhoushan."
    entities = ner_service.extract_entities(text)
    
    entity_texts = [e.text for e in entities]
    assert any("Shanghai" in t for t in entity_texts)
    assert any("Ningbo" in t for t in entity_texts)

    severity, score, bump, keywords = ner_service.analyze_severity(text)
    assert severity == "CRITICAL"
    assert "typhoon" in keywords or "shutdown" in keywords


def test_ner_normalization():
    assert ner_service.normalize_entity_text("Port of Rotterdam") == "rotterdam"
    assert ner_service.normalize_entity_text("Shanghai Container Terminal") == "shanghai"
    assert ner_service.normalize_entity_text("Acme Microelectronics Inc.") == "acme microelectronics"
