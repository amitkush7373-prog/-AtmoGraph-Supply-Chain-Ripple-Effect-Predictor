"""
AtmoGraph - FastAPI Server
Serves the supply chain graph (nodes + edges) from Neo4j to the frontend.

Run:
    uvicorn main:app --reload --port 8000

Endpoints:
    GET /              -> health check
    GET /graph          -> full graph (nodes + edges) as JSON
    GET /graph/stats     -> counts per node label / edge type
    GET /node/{node_id}  -> single node detail with its direct connections
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "atmograph123")

driver = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    yield
    driver.close()


app = FastAPI(title="AtmoGraph API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "AtmoGraph API"}


@app.get("/graph")
def get_graph():
    """Returns ALL nodes and edges in the graph as JSON."""
    node_query = """
        MATCH (n)
        RETURN n.id AS id, labels(n)[0] AS label, n.name AS name,
               n.industry AS industry, n.city AS city, n.country AS country,
               n.risk_score AS risk_score, n.risk_tag AS risk_tag
    """
    edge_query = """
        MATCH (a)-[r]->(b)
        RETURN r.id AS id, a.id AS source, b.id AS target, type(r) AS type,
               r.lead_time_days AS lead_time_days, r.risk_score AS risk_score
    """

    with driver.session() as session:
        nodes = [dict(record) for record in session.run(node_query)]
        edges = [dict(record) for record in session.run(edge_query)]

    return {"nodes": nodes, "edges": edges}


@app.get("/graph/stats")
def get_graph_stats():
    """Returns counts of nodes per label and edges per type."""
    label_query = """
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY count DESC
    """
    type_query = """
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(r) AS count
        ORDER BY count DESC
    """

    with driver.session() as session:
        node_counts = [dict(record) for record in session.run(label_query)]
        edge_counts = [dict(record) for record in session.run(type_query)]

    return {"node_counts": node_counts, "edge_counts": edge_counts}


@app.get("/node/{node_id}")
def get_node_detail(node_id: str):
    """Returns a single node plus its direct incoming/outgoing connections."""
    query = """
        MATCH (n {id: $node_id})
        OPTIONAL MATCH (n)-[r_out]->(out)
        OPTIONAL MATCH (in)-[r_in]->(n)
        RETURN n.id AS id, labels(n)[0] AS label, n.name AS name,
               n.industry AS industry, n.city AS city, n.country AS country,
               n.risk_score AS risk_score, n.risk_tag AS risk_tag,
               collect(DISTINCT {id: out.id, name: out.name, label: labels(out)[0]}) AS connects_to,
               collect(DISTINCT {id: in.id, name: in.name, label: labels(in)[0]}) AS connected_from
    """

    with driver.session() as session:
        result = session.run(query, node_id=node_id)
        record = result.single()

    if record is None or record["id"] is None:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    return dict(record)