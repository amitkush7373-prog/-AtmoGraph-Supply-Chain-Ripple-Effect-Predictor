"""
AtmoGraph - Data Loader
Loads nodes.json and edges.json into Neo4j using batched UNWIND queries.

Run:
    python load_data.py
"""

import json
import os
from pathlib import Path
from neo4j import GraphDatabase

DATA_DIR = Path(__file__).parent

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "atmograph123")

BATCH_SIZE = 500

NODE_QUERIES = {
    "Supplier": """
        UNWIND $rows AS row
        MERGE (n:Supplier {id: row.id})
        SET n.name = row.name,
            n.industry = row.industry,
            n.city = row.city,
            n.country = row.country,
            n.risk_score = row.risk_score,
            n.risk_tag = row.risk_tag
    """,
    "Manufacturer": """
        UNWIND $rows AS row
        MERGE (n:Manufacturer {id: row.id})
        SET n.name = row.name,
            n.industry = row.industry,
            n.city = row.city,
            n.country = row.country,
            n.risk_score = row.risk_score,
            n.risk_tag = row.risk_tag
    """,
    "Port": """
        UNWIND $rows AS row
        MERGE (n:Port {id: row.id})
        SET n.name = row.name,
            n.city = row.city,
            n.country = row.country,
            n.risk_score = row.risk_score,
            n.risk_tag = row.risk_tag
    """,
    "Distributor": """
        UNWIND $rows AS row
        MERGE (n:Distributor {id: row.id})
        SET n.name = row.name,
            n.city = row.city,
            n.country = row.country,
            n.risk_score = row.risk_score,
            n.risk_tag = row.risk_tag
    """,
}

EDGE_QUERIES = {
    "SUPPLIES_TO": """
        UNWIND $rows AS row
        MATCH (a:Supplier {id: row.source})
        MATCH (b:Manufacturer {id: row.target})
        MERGE (a)-[r:SUPPLIES_TO {id: row.id}]->(b)
        SET r.lead_time_days = row.lead_time_days,
            r.risk_score = row.risk_score
    """,
    "SHIPS_VIA": """
        UNWIND $rows AS row
        MATCH (a:Manufacturer {id: row.source})
        MATCH (b:Port {id: row.target})
        MERGE (a)-[r:SHIPS_VIA {id: row.id}]->(b)
        SET r.lead_time_days = row.lead_time_days,
            r.risk_score = row.risk_score
    """,
    "ROUTES_TO": """
        UNWIND $rows AS row
        MATCH (a:Port {id: row.source})
        MATCH (b:Distributor {id: row.target})
        MERGE (a)-[r:ROUTES_TO {id: row.id}]->(b)
        SET r.lead_time_days = row.lead_time_days,
            r.risk_score = row.risk_score
    """,
}


def chunks(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def load_nodes(session, nodes):
    by_label = {}
    for n in nodes:
        by_label.setdefault(n["label"], []).append(n)

    for label, rows in by_label.items():
        query = NODE_QUERIES[label]
        total = 0
        for batch in chunks(rows, BATCH_SIZE):
            session.run(query, rows=batch)
            total += len(batch)
        print(f"  {label}: {total} nodes loaded")


def load_edges(session, edges):
    by_type = {}
    for e in edges:
        by_type.setdefault(e["type"], []).append(e)

    for rel_type, rows in by_type.items():
        query = EDGE_QUERIES[rel_type]
        total = 0
        for batch in chunks(rows, BATCH_SIZE):
            session.run(query, rows=batch)
            total += len(batch)
        print(f"  {rel_type}: {total} edges loaded")


def main():
    nodes = json.loads((DATA_DIR / "nodes.json").read_text())
    edges = json.loads((DATA_DIR / "edges.json").read_text())

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    try:
        with driver.session() as session:
            print("Loading nodes...")
            load_nodes(session, nodes)

            print("Loading edges...")
            load_edges(session, edges)

            result = session.run("MATCH (n) RETURN count(n) AS node_count")
            node_count = result.single()["node_count"]

            result = session.run("MATCH ()-[r]->() RETURN count(r) AS edge_count")
            edge_count = result.single()["edge_count"]

            print(f"\nDone. Neo4j now has {node_count} nodes and {edge_count} relationships.")
    finally:
        driver.close()


if __name__ == "__main__":
    main()