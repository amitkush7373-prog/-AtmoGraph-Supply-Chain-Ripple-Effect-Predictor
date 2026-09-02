#!/usr/bin/env python3
"""
AtmoGraph - Mid-Project Review Pipeline Demonstration
Executes the full end-to-end NLP -> Entity Matching -> Neo4j Risk Engine -> Ripple Effect Pipeline.

Usage:
    python scripts/demo_pipeline.py [--sample 1]
"""

import argparse
import datetime
import json
import os
import sys
import uuid
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import db
from app.models.news_models import MatchedNode
from app.models.risk_models import RiskLevel, NodeStatus
from app.services.ner_service import ner_service, ENTITY_ALIASES
from app.services.risk_service import risk_service, _score_to_risk_level, _risk_level_to_status
from app.services.graph_service import graph_service
from app.utils.seed_data import generate_supply_chain_graph, save_graph_to_disk


def parse_args():
    parser = argparse.ArgumentParser(description="AtmoGraph Mid-Project Review Demo")
    parser.add_argument(
        "--sample",
        type=int,
        default=0,
        help="Index of sample disruption from data/sample_disruptions.json (0 for top 3, 1-10 for specific)",
    )
    return parser.parse_args()


def load_sample_disruptions():
    data_path = Path(__file__).parent.parent / "data" / "sample_disruptions.json"
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_local_graph():
    data_dir = Path(__file__).parent.parent / "data"
    nodes_file = data_dir / "nodes.json"
    edges_file = data_dir / "edges.json"
    if not nodes_file.exists() or not edges_file.exists():
        nodes, edges = generate_supply_chain_graph(seed=42)
        save_graph_to_disk(nodes, edges, data_dir)
        return nodes, edges
    with open(nodes_file, "r", encoding="utf-8") as f:
        nodes = json.load(f)
    with open(edges_file, "r", encoding="utf-8") as f:
        edges = json.load(f)
    return nodes, edges


def print_banner(title: str):
    print("\n" + "=" * 75)
    print(f"  {title}")
    print("=" * 75)


def run_pipeline_on_text(news_item: dict, is_neo4j_online: bool, local_nodes: list = None, local_edges: list = None):
    title = news_item.get("title", "Disruption Alert")
    text = news_item.get("text", "")
    category = news_item.get("category", "General")

    print_banner(f"SAMPLE DISRUPTION: {title}")
    print(f"Category: {category}")
    print(f"Raw News Text:\n  \"{text}\"")

    # Step 1: spaCy NER Extraction
    print("\n[Step 1] Running spaCy Named Entity Recognition (NER)...")
    entities = ner_service.extract_entities(text)
    detected_severity, severity_score, risk_bump, matched_keywords = ner_service.analyze_severity(text)

    print(f"  -> Extracted {len(entities)} Named Entities:")
    for ent in entities:
        print(f"     * '{ent.text}' [{ent.label}] (normalized: '{ent.normalized}')")

    print(f"  -> Detected Disruption Severity: {detected_severity} (Score: {severity_score:.2f}, Risk Bump: +{risk_bump:.2f})")
    print(f"  -> Matched Severity Keywords:    {matched_keywords}")

    if is_neo4j_online:
        # Online Neo4j Execution
        print("\n[Step 2] Matching Entities Against Neo4j Graph Nodes...")
        matched_nodes = risk_service.match_entities_to_nodes(entities)
        print(f"  -> Found {len(matched_nodes)} matching supply chain nodes in Neo4j:")
        for mn in matched_nodes[:8]:
            loc_str = f" ({mn.city}, {mn.country})" if mn.city else ""
            print(f"     * [{mn.type}] {mn.name}{loc_str} (ID: {mn.id}, Match: {mn.match_type}, Conf: {mn.confidence:.0%})")

        print("\n[Step 3] Updating Risk States in Neo4j & Cascading Downstream Ripple Effects...")
        response = risk_service.process_news_disruption(text=text, propagate_ripple=True)

        print(f"\n[Step 4] Direct Risk Updates Applied to Neo4j ({len(response.risk_updates)} nodes):")
        for up in response.risk_updates[:6]:
            print(f"  * {up.name} ({up.id}):")
            print(f"      Risk Level: {up.previous_risk.value} -> {up.new_risk.value} (Score: {up.previous_score:.2f} -> {up.new_score:.2f})")
            print(f"      Status:     {up.status.value}")
            print(f"      Reason:     {up.risk_reason}")

        if response.ripple_effects:
            print(f"\n[Step 5] Downstream Ripple Effects Cascaded ({len(response.ripple_effects)} nodes):")
            for rp in response.ripple_effects[:6]:
                print(f"  * {rp.name} ({rp.id}):")
                print(f"      Upstream Origin: {rp.parent_name} via {rp.relationship}")
                print(f"      Risk Shift:      {rp.previous_risk} -> {rp.new_risk} (Score: {rp.previous_score:.2f} -> {rp.new_score:.2f})")
                print(f"      Impact:          {rp.impact_reason}")

        print(f"\n[SUCCESS] Disruption Event Logged in Neo4j: ID={response.disruption_event_id}")

    else:
        # Offline Demonstration using local dataset
        print("\n[Step 2] Resolving Entities Against Supply Chain Graph Dataset...")
        matched_nodes = []
        for ent in entities:
            norm = ent.normalized.lower()
            aliases = ENTITY_ALIASES.get(norm, [])
            search_terms = set([norm, ent.text.lower()] + aliases)
            for n in (local_nodes or []):
                n_city = (n.get("city") or "").lower()
                n_country = (n.get("country") or "").lower()
                n_name = n.get("name", "").lower()
                if n_city in search_terms or n_country in search_terms or any(t in n_name for t in search_terms):
                    if not any(m["id"] == n["id"] for m in matched_nodes):
                        m_type = "city_match" if n_city in search_terms else ("country_match" if n_country in search_terms else "name_match")
                        matched_nodes.append({
                            "id": n["id"],
                            "name": n["name"],
                            "type": n.get("type") or n.get("label"),
                            "city": n.get("city"),
                            "country": n.get("country"),
                            "match_type": m_type,
                            "confidence": 0.95 if m_type == "city_match" else 0.80,
                            "node": n,
                        })

        print(f"  -> Found {len(matched_nodes)} matching supply chain nodes:")
        for mn in matched_nodes[:8]:
            loc_str = f" ({mn.get('city')}, {mn.get('country')})" if mn.get("city") else ""
            print(f"     * [{mn['type']}] {mn['name']}{loc_str} (ID: {mn['id']}, Match: {mn['match_type']}, Conf: {mn['confidence']:.0%})")

        print("\n[Step 3 & 4] Calculating Risk Updates...")
        matched_ids = [m["id"] for m in matched_nodes]
        for mn in matched_nodes[:6]:
            node = mn["node"]
            p_score = float(node.get("risk_score", 0.1))
            p_risk = node.get("risk", "LOW")
            n_score = round(min(1.0, p_score + risk_bump), 3)
            n_risk = _score_to_risk_level(n_score).value
            n_status = _risk_level_to_status(RiskLevel(n_risk)).value
            print(f"  * {node['name']} ({node['id']}):")
            print(f"      Risk Level: {p_risk} -> {n_risk} (Score: {p_score:.2f} -> {n_score:.2f})")
            print(f"      Status:     {n_status}")
            print(f"      Reason:     Direct disruption impact from '{matched_keywords[:2]}' alert (Severity: {detected_severity})")

        # Downstream ripple
        ripple_matches = [e for e in (local_edges or []) if e["source"] in matched_ids[:10]]
        if ripple_matches:
            print(f"\n[Step 5] Cascading Downstream Ripple Effects ({len(ripple_matches)} routes identified):")
            for rm in ripple_matches[:6]:
                tgt_node = next((n for n in local_nodes if n["id"] == rm["target"]), None)
                if tgt_node:
                    tgt_p_score = float(tgt_node.get("risk_score", 0.1))
                    tgt_n_score = round(min(1.0, tgt_p_score + (risk_bump * 0.5)), 3)
                    tgt_p_risk = tgt_node.get("risk", "LOW")
                    tgt_n_risk = _score_to_risk_level(tgt_n_score).value
                    print(f"  * {tgt_node['name']} ({tgt_node['id']}):")
                    print(f"      Upstream Route: via {rm['type']} (Lead Time: {rm.get('lead_time_days', 7)} days)")
                    print(f"      Risk Shift:     {tgt_p_risk} -> {tgt_n_risk} (Score: {tgt_p_score:.2f} -> {tgt_n_score:.2f})")

        event_id = f"DISRUPT_{uuid.uuid4().hex[:8].upper()}"
        print(f"\n[EVENT LOGGED] Disruption Event ID: {event_id}")


def main():
    args = parse_args()
    samples = load_sample_disruptions()
    local_nodes, local_edges = load_local_graph()

    print_banner("ATMOGRAPH: SUPPLY CHAIN RIPPLE EFFECT PREDICTOR")
    print("Backend NLP & Graph Pipeline Mid-Project Review Demonstration")
    print(f"Loaded {len(samples)} curated disruption scenarios.")
    print(f"Mock Supply Chain Graph: {len(local_nodes):,} Nodes, {len(local_edges):,} Relationships")

    # Check database status
    db.connect()
    is_online = db.is_connected()
    if is_online:
        print(f"Neo4j Database: CONNECTED ({settings.NEO4J_URI})")
    else:
        print(f"Neo4j Database: OFFLINE (Operating in local graph dataset evaluation mode)")
        print(f"  [Tip] Run `docker-compose up -d neo4j` to start live Neo4j database.")

    if args.sample > 0 and args.sample <= len(samples):
        target_samples = [samples[args.sample - 1]]
    else:
        # Run top 3 scenarios by default
        target_samples = samples[:3]

    for item in target_samples:
        run_pipeline_on_text(item, is_online, local_nodes, local_edges)

    if is_online:
        print_banner("CURRENT GLOBAL GRAPH RISK SUMMARY (Neo4j)")
        summary = graph_service.get_risk_summary()
        print(f"Total Nodes Evaluated: {summary.total_nodes:,}")
        print(f"Average Network Risk:  {summary.average_risk_score:.3f}")
        print(f"Risk Tier Distribution:")
        print(f"  - LOW:      {summary.risk_distribution.LOW:,}")
        print(f"  - MEDIUM:   {summary.risk_distribution.MEDIUM:,}")
        print(f"  - HIGH:     {summary.risk_distribution.HIGH:,}")
        print(f"  - CRITICAL: {summary.risk_distribution.CRITICAL:,}")
    else:
        print_banner("DATASET RISK DISTRIBUTION (Local Graph)")
        low_c = sum(1 for n in local_nodes if n.get("risk") == "LOW")
        med_c = sum(1 for n in local_nodes if n.get("risk") == "MEDIUM")
        hi_c = sum(1 for n in local_nodes if n.get("risk") == "HIGH")
        crit_c = sum(1 for n in local_nodes if n.get("risk") == "CRITICAL")
        print(f"Total Nodes in Dataset: {len(local_nodes):,}")
        print(f"Total Relationships:    {len(local_edges):,}")
        print(f"Distribution: LOW={low_c:,}, MEDIUM={med_c:,}, HIGH={hi_c:,}, CRITICAL={crit_c:,}")

    print_banner("DEMO COMPLETED SUCCESSFULLY")


if __name__ == "__main__":
    main()
