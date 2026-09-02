import datetime
import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple
from app.core.database import db
from app.models.news_models import (
    ExtractedEntity, MatchedNode, NewsAnalyzeResponse, RippleEffectItem
)
from app.models.risk_models import NodeRiskUpdate, RiskLevel, NodeStatus
from app.services.ner_service import ENTITY_ALIASES, ner_service

logger = logging.getLogger("atmograph.risk_service")


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
    @staticmethod
    def match_entities_to_nodes(entities: List[ExtractedEntity]) -> List[MatchedNode]:
        """
        Matches extracted NER entities to supply chain nodes in Neo4j using
        exact, city, country, substring, and alias matching.
        """
        if not entities:
            return []

        matched_nodes_map: Dict[str, MatchedNode] = {}

        for ent in entities:
            raw_text = ent.text.strip()
            norm_text = ent.normalized.strip()
            aliases = ENTITY_ALIASES.get(norm_text, [])
            all_search_terms = list(set([raw_text, norm_text] + aliases))

            # Query Neo4j for matching city, country, or name
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

            try:
                records = db.execute_read(query, {"terms": terms_lower})
                for r in records:
                    nid = r["id"]
                    if nid not in matched_nodes_map:
                        # Determine match type & confidence
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
            except Exception as e:
                logger.error(f"Error querying Neo4j for entity '{raw_text}': {e}")

        return list(matched_nodes_map.values())

    @staticmethod
    def process_news_disruption(
        text: str,
        severity_override: Optional[RiskLevel] = None,
        propagate_ripple: bool = True
    ) -> NewsAnalyzeResponse:
        """
        Full Week 2 Disruption Pipeline:
        1. spaCy NER on raw text
        2. Normalization & Severity analysis
        3. Match entities against Neo4j nodes
        4. Update primary nodes' risk states in Neo4j
        5. Create DisruptionEvent node
        6. Compute and update downstream ripple effect
        """
        # 1. NLP Extraction
        entities = ner_service.extract_entities(text)
        detected_severity, severity_score, risk_bump, matched_keywords = ner_service.analyze_severity(text)

        if severity_override:
            detected_severity = severity_override.value
            risk_bump = 0.45 if detected_severity == "CRITICAL" else (0.30 if detected_severity == "HIGH" else 0.15)
            severity_score = 0.85 if detected_severity == "CRITICAL" else (0.65 if detected_severity == "HIGH" else 0.40)

        # 2. Entity Matching
        matched_nodes = RiskService.match_entities_to_nodes(entities)
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

        # 3. Fetch current risk scores of matched nodes
        fetch_query = """
            MATCH (n)
            WHERE n.id IN $ids
            RETURN n.id AS id,
                   n.name AS name,
                   labels(n)[0] AS label,
                   coalesce(n.type, labels(n)[0]) AS type,
                   coalesce(n.risk, 'LOW') AS risk,
                   coalesce(n.risk_score, 0.1) AS risk_score,
                   n.country AS country,
                   n.city AS city
        """
        current_nodes = db.execute_read(fetch_query, {"ids": matched_ids})

        # Calculate new scores
        primary_update_rows = []
        for cn in current_nodes:
            prev_score = float(cn["risk_score"])
            prev_risk = RiskLevel(cn["risk"].upper() if cn["risk"].upper() in RiskLevel.__members__ else "LOW")
            new_score = round(min(1.0, max(0.0, prev_score + risk_bump)), 3)
            new_risk = _score_to_risk_level(new_score)
            new_status = _risk_level_to_status(new_risk)
            reason = f"Direct disruption impact from '{matched_keywords[:3]}' alert (Severity: {detected_severity})"

            update_obj = NodeRiskUpdate(
                id=cn["id"],
                name=cn["name"],
                type=cn["type"],
                previous_risk=prev_risk,
                new_risk=new_risk,
                previous_score=prev_score,
                new_score=new_score,
                status=new_status,
                risk_reason=reason,
                country=cn.get("country"),
                city=cn.get("city"),
            )
            risk_updates.append(update_obj)
            primary_update_rows.append({
                "id": cn["id"],
                "risk": new_risk.value,
                "risk_score": new_score,
                "status": new_status.value,
                "risk_reason": reason,
                "updated_at": now_iso,
            })

        # 4. Batch update primary nodes in Neo4j
        if primary_update_rows:
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

        # 5. Create DisruptionEvent node & connect to affected nodes
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

        # 6. Downstream Ripple Effect Propagation
        if propagate_ripple and matched_ids:
            ripple_query = """
                MATCH (parent)-[r]->(downstream)
                WHERE parent.id IN $parent_ids
                  AND NOT downstream:DisruptionEvent
                  AND NOT downstream.id IN $parent_ids
                  AND type(r) IN ['SHIPS_TO', 'SUPPLIES', 'DISTRIBUTES_TO']
                RETURN DISTINCT downstream.id AS id,
                                downstream.name AS name,
                                labels(downstream)[0] AS label,
                                coalesce(downstream.type, labels(downstream)[0]) AS type,
                                coalesce(downstream.risk, 'LOW') AS risk,
                                coalesce(downstream.risk_score, 0.1) AS risk_score,
                                parent.id AS parent_id,
                                parent.name AS parent_name,
                                type(r) AS relationship
                LIMIT 30
            """
            ripple_targets = db.execute_read(ripple_query, {"parent_ids": matched_ids})
            ripple_bump = round(risk_bump * 0.5, 3)  # Downstream absorbs 50% ripple delta

            ripple_update_rows = []
            for rt in ripple_targets:
                r_prev_score = float(rt["risk_score"])
                r_new_score = round(min(1.0, r_prev_score + ripple_bump), 3)
                r_prev_risk = _score_to_risk_level(r_prev_score).value
                r_new_risk = _score_to_risk_level(r_new_score).value
                r_status = _risk_level_to_status(RiskLevel(r_new_risk)).value
                r_reason = f"Ripple delay propagated from upstream {rt['parent_name']}"

                ripple_effects.append(
                    RippleEffectItem(
                        id=rt["id"],
                        name=rt["name"],
                        label=rt["label"],
                        type=rt["type"],
                        parent_id=rt["parent_id"],
                        parent_name=rt["parent_name"],
                        relationship=rt["relationship"],
                        previous_risk=r_prev_risk,
                        new_risk=r_new_risk,
                        previous_score=r_prev_score,
                        new_score=r_new_score,
                        impact_reason=r_reason,
                    )
                )
                ripple_update_rows.append({
                    "id": rt["id"],
                    "risk": r_new_risk,
                    "risk_score": r_new_score,
                    "status": r_status,
                    "risk_reason": r_reason,
                    "updated_at": now_iso,
                })

            if ripple_update_rows:
                db.execute_write("""
                    UNWIND $rows AS row
                    MATCH (n {id: row.id})
                    SET n.risk = row.risk,
                        n.risk_score = row.risk_score,
                        n.status = row.status,
                        n.risk_reason = row.risk_reason,
                        n.updated_at = row.updated_at
                """, {"rows": ripple_update_rows})

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

    @staticmethod
    def get_recent_disruptions(limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches recorded disruption events."""
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
        return db.execute_read(query, {"limit": limit})


risk_service = RiskService()
