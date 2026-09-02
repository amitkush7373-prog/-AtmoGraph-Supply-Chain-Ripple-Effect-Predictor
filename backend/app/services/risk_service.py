import datetime
import json
import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.database import db
from app.models.news_models import (
    ExtractedEntity, MatchedNode, NewsAnalyzeResponse, RippleEffectItem
)
from app.models.risk_models import NodeRiskUpdate, RiskLevel, NodeStatus
from app.services.ner_service import ENTITY_ALIASES, ner_service

logger = logging.getLogger("atmograph.risk_service")

DATA_DIR = Path(__file__).parent.parent.parent / "data"
NODES_PATH = DATA_DIR / "nodes.json"
EDGES_PATH = DATA_DIR / "edges.json"


def _score_to_risk_level(score: float) -> RiskLevel:
    if score >= 0.85:
        return RiskLevel.CRITICAL
    elif score >= 0.60:
        return RiskLevel.HIGH
    elif score >= 0.30:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _risk_level_to_status(level: RiskLevel) -> NodeStatus:
    if level == RiskLevel.CRITICAL:
        return NodeStatus.HALTED
    elif level == RiskLevel.HIGH:
        return NodeStatus.DISRUPTED
    elif level == RiskLevel.MEDIUM:
        return NodeStatus.DELAYED
    return NodeStatus.OPERATIONAL


class RiskService:
    _cached_nodes: Optional[List[Dict[str, Any]]] = None
    _cached_edges: Optional[List[Dict[str, Any]]] = None
    _in_memory_events: List[Dict[str, Any]] = []

    @classmethod
    def _load_local_dataset(cls) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        if cls._cached_nodes is None or cls._cached_edges is None:
            if NODES_PATH.exists() and EDGES_PATH.exists():
                with open(NODES_PATH, "r", encoding="utf-8") as f:
                    cls._cached_nodes = json.load(f)
                with open(EDGES_PATH, "r", encoding="utf-8") as f:
                    cls._cached_edges = json.load(f)
            else:
                cls._cached_nodes = []
                cls._cached_edges = []
        return cls._cached_nodes, cls._cached_edges

    @classmethod
    def match_entities_to_nodes(cls, entities: List[ExtractedEntity]) -> List[MatchedNode]:
        """
        Matches extracted NER entities to supply chain nodes using Neo4j if online,
        or local dataset fallback.
        """
        if not entities:
            return []

        if db.is_connected():
            try:
                res = cls._match_entities_neo4j(entities)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Neo4j entity matching failed, falling back to local dataset: {e}")

        return cls._match_entities_local(entities)

    @classmethod
    def _match_entities_neo4j(cls, entities: List[ExtractedEntity]) -> List[MatchedNode]:
        matched_nodes_map: Dict[str, MatchedNode] = {}

        for ent in entities:
            raw_text = ent.text.strip()
            norm_text = ent.normalized.strip()
            aliases = ENTITY_ALIASES.get(norm_text, [])
            all_search_terms = list(set([raw_text, norm_text] + aliases))

            query = """
                MATCH (n)
                WHERE NOT n:DisruptionEvent AND (
                    toLower(n.city) IN $terms
                    OR toLower(n.country) IN $terms
                    OR toLower(n.name) IN $terms
                    OR ANY(term IN $terms WHERE toLower(n.name) CONTAINS term)
                )
                RETURN n.id AS id,
                       n.name AS name,
                       labels(n)[0] AS label,
                       coalesce(n.type, labels(n)[0]) AS type,
                       n.country AS country,
                       n.city AS city
                LIMIT 50
            """
            terms_lower = [t.lower() for t in all_search_terms if len(t) >= 2]
            if not terms_lower:
                continue

            records = db.execute_read(query, {"terms": terms_lower})
            for r in records:
                nid = r["id"]
                if nid not in matched_nodes_map:
                    match_type = "name_match"
                    conf = 0.85
                    if r.get("city") and r["city"].lower() in terms_lower:
                        match_type = "city_match"
                        conf = 0.95
                    elif r.get("country") and r["country"].lower() in terms_lower:
                        match_type = "country_match"
                        conf = 0.75
                    elif any(a in r["name"].lower() for a in aliases):
                        match_type = "alias_match"
                        conf = 0.90

                    matched_nodes_map[nid] = MatchedNode(
                        id=nid,
                        name=r["name"],
                        label=r["label"],
                        type=r["type"],
                        country=r.get("country"),
                        city=r.get("city"),
                        match_type=match_type,
                        confidence=conf,
                    )

        return list(matched_nodes_map.values())

    @classmethod
    def _match_entities_local(cls, entities: List[ExtractedEntity]) -> List[MatchedNode]:
        nodes, _ = cls._load_local_dataset()
        matched_nodes_map: Dict[str, MatchedNode] = {}

        for ent in entities:
            raw_text = ent.text.strip().lower()
            norm_text = ent.normalized.strip().lower()
            aliases = [a.lower() for a in ENTITY_ALIASES.get(ent.normalized.strip(), [])]
            search_terms = list(set([raw_text, norm_text] + aliases))

            for n in nodes:
                nid = n["id"]
                if nid in matched_nodes_map:
                    continue

                name_l = n.get("name", "").lower()
                city_l = (n.get("city") or "").lower()
                country_l = (n.get("country") or "").lower()

                match_type = None
                conf = 0.85

                if city_l and city_l in search_terms:
                    match_type = "city_match"
                    conf = 0.95
                elif any(term in name_l for term in search_terms if len(term) >= 3):
                    match_type = "name_match"
                    conf = 0.88
                elif country_l and country_l in search_terms:
                    match_type = "country_match"
                    conf = 0.75

                if match_type:
                    matched_nodes_map[nid] = MatchedNode(
                        id=nid,
                        name=n["name"],
                        label=n.get("type", "Unknown"),
                        type=n.get("type", "Unknown"),
                        country=n.get("country"),
                        city=n.get("city"),
                        match_type=match_type,
                        confidence=conf,
                    )
                    if len(matched_nodes_map) >= 30:
                        break

        return list(matched_nodes_map.values())

    @classmethod
    def process_news_disruption(
        cls,
        text: str,
        severity_override: Optional[RiskLevel] = None,
        propagate_ripple: bool = True
    ) -> NewsAnalyzeResponse:
        """
        Full Week 2 Disruption Pipeline with live Neo4j and fallback dataset support.
        """
        entities = ner_service.extract_entities(text)
        detected_severity, severity_score, risk_bump, matched_keywords = ner_service.analyze_severity(text)

        if severity_override:
            detected_severity = severity_override.value
            risk_bump = 0.45 if detected_severity == "CRITICAL" else (0.30 if detected_severity == "HIGH" else 0.15)
            severity_score = 0.85 if detected_severity == "CRITICAL" else (0.65 if detected_severity == "HIGH" else 0.40)

        matched_nodes = cls.match_entities_to_nodes(entities)
        risk_updates: List[NodeRiskUpdate] = []
        ripple_effects: List[RippleEffectItem] = []
        event_id = f"DISRUPT_{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not matched_nodes:
            return NewsAnalyzeResponse(
                text=text,
                entities=entities,
                severity=detected_severity,
                severity_score=severity_score,
                matched_keywords=matched_keywords,
                matched_nodes=[],
                risk_updates=[],
                ripple_effects=[],
                disruption_event_id=None,
                timestamp=now_iso,
                message="No matching supply chain graph entities found for the detected locations/organizations.",
            )

        matched_ids = [m.id for m in matched_nodes]

        # Process Primary Updates
        nodes, edges = cls._load_local_dataset()
        node_map = {n["id"]: n for n in nodes}

        primary_update_rows = []
        for mn in matched_nodes:
            nid = mn.id
            curr_data = node_map.get(nid, {})
            prev_score = float(curr_data.get("risk_score", 0.15))
            prev_risk = RiskLevel(curr_data.get("risk", "LOW").upper() if curr_data.get("risk", "LOW").upper() in RiskLevel.__members__ else "LOW")
            new_score = round(min(1.0, max(0.0, prev_score + risk_bump)), 3)
            new_risk = _score_to_risk_level(new_score)
            new_status = _risk_level_to_status(new_risk)
            reason = f"Direct disruption impact from '{matched_keywords[:3]}' alert (Severity: {detected_severity})"

            update_obj = NodeRiskUpdate(
                id=nid,
                name=mn.name,
                type=mn.type,
                previous_risk=prev_risk,
                new_risk=new_risk,
                previous_score=prev_score,
                new_score=new_score,
                status=new_status,
                risk_reason=reason,
                country=mn.country,
                city=mn.city,
            )
            risk_updates.append(update_obj)

            # Update in local cache as well
            if nid in node_map:
                node_map[nid]["risk"] = new_risk.value
                node_map[nid]["risk_score"] = new_score
                node_map[nid]["status"] = new_status.value
                node_map[nid]["risk_reason"] = reason
                node_map[nid]["updated_at"] = now_iso

            primary_update_rows.append({
                "id": nid,
                "risk": new_risk.value,
                "risk_score": new_score,
                "status": new_status.value,
                "risk_reason": reason,
                "updated_at": now_iso,
            })

        # If Neo4j is online, persist to Neo4j
        if db.is_connected() and primary_update_rows:
            try:
                update_query = """
                    UNWIND $rows AS row
                    MATCH (n {id: row.id})
                    SET n.risk = row.risk,
                        n.risk_score = row.risk_score,
                        n.status = row.status,
                        n.risk_reason = row.risk_reason,
                        n.updated_at = row.updated_at
                """
                db.execute_write(update_query, {"rows": primary_update_rows})

                create_event_query = """
                    MERGE (e:DisruptionEvent {id: $event_id})
                    SET e.title = $title,
                        e.text = $text,
                        e.severity = $severity,
                        e.severity_score = $severity_score,
                        e.matched_keywords = $keywords,
                        e.timestamp = $timestamp
                    WITH e
                    UNWIND $affected_ids AS target_id
                    MATCH (target {id: target_id})
                    MERGE (e)-[r:AFFECTS {timestamp: $timestamp, risk_delta: $risk_delta}]->(target)
                """
                title = f"Disruption Event in {', '.join(set([m.city or m.country or m.name for m in matched_nodes[:3]]))}"
                db.execute_write(create_event_query, {
                    "event_id": event_id,
                    "title": title,
                    "text": text,
                    "severity": detected_severity,
                    "severity_score": severity_score,
                    "keywords": matched_keywords,
                    "timestamp": now_iso,
                    "affected_ids": matched_ids,
                    "risk_delta": risk_bump,
                })
            except Exception as e:
                logger.warning(f"Neo4j event write failed: {e}")

        # Compute Ripple Effects
        if propagate_ripple and matched_ids:
            ripple_bump = round(risk_bump * 0.5, 3)
            ripple_update_rows = []

            for edge in edges:
                src_id = edge.get("source")
                tgt_id = edge.get("target")

                if src_id in matched_ids and tgt_id not in matched_ids:
                    tgt_node = node_map.get(tgt_id)
                    src_node = node_map.get(src_id)
                    if tgt_node and src_node:
                        r_prev_score = float(tgt_node.get("risk_score", 0.1))
                        r_new_score = round(min(1.0, r_prev_score + ripple_bump), 3)
                        r_prev_risk = _score_to_risk_level(r_prev_score).value
                        r_new_risk = _score_to_risk_level(r_new_score).value
                        r_status = _risk_level_to_status(RiskLevel(r_new_risk)).value
                        r_reason = f"Ripple delay propagated from upstream {src_node.get('name')}"

                        ripple_effects.append(
                            RippleEffectItem(
                                id=tgt_id,
                                name=tgt_node.get("name", ""),
                                label=tgt_node.get("type", "Unknown"),
                                type=tgt_node.get("type", "Unknown"),
                                parent_id=src_id,
                                parent_name=src_node.get("name", ""),
                                relationship=edge.get("relationship", "SHIPS_TO"),
                                previous_risk=r_prev_risk,
                                new_risk=r_new_risk,
                                previous_score=r_prev_score,
                                new_score=r_new_score,
                                impact_reason=r_reason,
                            )
                        )

                        tgt_node["risk"] = r_new_risk
                        tgt_node["risk_score"] = r_new_score
                        tgt_node["status"] = r_status
                        tgt_node["risk_reason"] = r_reason
                        tgt_node["updated_at"] = now_iso

                        ripple_update_rows.append({
                            "id": tgt_id,
                            "risk": r_new_risk,
                            "risk_score": r_new_score,
                            "status": r_status,
                            "risk_reason": r_reason,
                            "updated_at": now_iso,
                        })
                        if len(ripple_effects) >= 20:
                            break

            if db.is_connected() and ripple_update_rows:
                try:
                    db.execute_write("""
                        UNWIND $rows AS row
                        MATCH (n {id: row.id})
                        SET n.risk = row.risk,
                            n.risk_score = row.risk_score,
                            n.status = row.status,
                            n.risk_reason = row.risk_reason,
                            n.updated_at = row.updated_at
                    """, {"rows": ripple_update_rows})
                except Exception as e:
                    logger.warning(f"Neo4j ripple write failed: {e}")

        # Store in-memory disruption event
        title = f"Disruption Event in {', '.join(set([m.city or m.country or m.name for m in matched_nodes[:3]]))}"
        cls._in_memory_events.insert(0, {
            "id": event_id,
            "title": title,
            "text": text,
            "severity": detected_severity,
            "severity_score": severity_score,
            "matched_keywords": matched_keywords,
            "timestamp": now_iso,
            "affected_nodes_count": len(risk_updates),
        })

        message = f"Successfully analyzed news. Updated {len(risk_updates)} primary node(s) and {len(ripple_effects)} downstream ripple node(s) with {detected_severity} severity."

        return NewsAnalyzeResponse(
            text=text,
            entities=entities,
            severity=detected_severity,
            severity_score=severity_score,
            matched_keywords=matched_keywords,
            matched_nodes=matched_nodes,
            risk_updates=risk_updates,
            ripple_effects=ripple_effects,
            disruption_event_id=event_id,
            timestamp=now_iso,
            message=message,
        )

    @classmethod
    def get_recent_disruptions(cls, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches recorded disruption events from Neo4j or in-memory fallback."""
        if db.is_connected():
            try:
                query = """
                    MATCH (d:DisruptionEvent)
                    OPTIONAL MATCH (d)-[:AFFECTS]->(target)
                    RETURN d.id AS id,
                           d.title AS title,
                           d.text AS text,
                           d.severity AS severity,
                           d.severity_score AS severity_score,
                           coalesce(d.matched_keywords, []) AS matched_keywords,
                           d.timestamp AS timestamp,
                           count(target) AS affected_nodes_count
                    ORDER BY d.timestamp DESC
                    LIMIT $limit
                """
                res = db.execute_read(query, {"limit": limit})
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Neo4j events fetch failed: {e}")

        return cls._in_memory_events[:limit]


risk_service = RiskService()
