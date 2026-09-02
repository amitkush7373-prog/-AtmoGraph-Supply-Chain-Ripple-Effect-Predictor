# AtmoGraph – Supply Chain Ripple Effect Predictor

> **Graph-Native Supply-Chain Risk Analysis & Ripple Effect Prediction Engine**  
> *Week 1 (Graph Foundations) & Week 2 (NLP Disruption Pipeline) Implementation*

---

## 1. Project Overview

**AtmoGraph** is an enterprise-grade supply-chain risk analysis platform that models complex global multi-tier supply networks as interconnected graph topologies in **Neo4j** and applies real-time **Natural Language Processing (NLP)** via **spaCy** to ingest news alerts, detect geopolitical and operational disruptions, dynamically adjust entity risk scores, and propagate ripple effects through downstream supply routes.

### Scope Delivered:
- **Week 1 – Graph Foundations**: Neo4j connection pool, realistic multi-tier global supply graph generation (2,300+ nodes & 7,900+ edges across Suppliers, Manufacturers, Ports, Warehouses, Distributors, and Products), schema constraints, and batch Cypher ingestion.
- **Week 2 – NLP & Disruption Pipeline**: Real spaCy Named Entity Recognition (NER), location & facility normalization, alias mapping, disruption severity analysis, Neo4j node resolution, dynamic risk state transitions (`LOW` $\rightarrow$ `MEDIUM` $\rightarrow$ `HIGH` $\rightarrow$ `CRITICAL`), `DisruptionEvent` auditing, and downstream ripple propagation.
- **Mid-Project Review**: Automated CLI demo suite (`demo_pipeline.py`), unit test suite, and full REST API surface for React frontend integration.

---

## 2. Architecture & Directory Structure

```
backend/
├── app/
│   ├── main.py                      # FastAPI application entrypoint, CORS, lifespan, exception handlers
│   │
│   ├── api/
│   │   └── routes/
│   │       ├── health.py            # GET /api/health (Live Neo4j ping check)
│   │       ├── graph.py             # GET /api/graph, GET /api/graph/summary, GET /api/graph/node/{node_id}
│   │       ├── entities.py          # GET /api/entities, GET /api/entities/{node_id}
│   │       ├── risk.py              # GET /api/risk/summary, GET /api/risk/nodes
│   │       └── news.py              # POST /api/news/analyze, GET /api/news/events
│   │
│   ├── core/
│   │   ├── config.py                # Pydantic configuration & environment settings
│   │   └── database.py              # Singleton Neo4j connection pool & query executor
│   │
│   ├── models/
│   │   ├── graph_models.py          # GraphNode, GraphEdge, GraphResponse, NodeDetailResponse
│   │   ├── news_models.py           # NewsAnalyzeRequest, NewsAnalyzeResponse, ExtractedEntity
│   │   └── risk_models.py           # RiskLevel, NodeStatus, RiskSummaryResponse, NodeRiskUpdate
│   │
│   ├── services/
│   │   ├── neo4j_service.py         # Schema constraint setup & batch UNWIND Cypher ingestion
│   │   ├── graph_service.py         # Subnetwork filtering, aggregations, and node detail lookups
│   │   ├── ner_service.py           # spaCy NER extraction, entity normalization, severity keyword scorer
│   │   └── risk_service.py          # Neo4j entity matching, risk calculation, and ripple cascading
│   │
│   └── utils/
│       └── seed_data.py             # Multi-tier synthetic global supply network generator
│
├── scripts/
│   ├── init_neo4j.py                # Neo4j schema constraint and index initializer
│   ├── seed_graph.py                # High-throughput batch Cypher data seeder
│   └── demo_pipeline.py             # End-to-end CLI demonstration for review evaluation
│
├── data/
│   ├── sample_disruptions.json      # 10 realistic global supply chain disruption scenarios
│   ├── nodes.json                   # Serialized mock graph nodes (2,360 entities)
│   └── edges.json                   # Serialized mock graph edges (7,984 relationships)
│
├── tests/
│   ├── test_nlp.py                  # spaCy NER extraction & severity unit tests
│   ├── test_seed.py                 # Graph dataset generator validation tests
│   └── test_api.py                  # FastAPI endpoint integration tests
│
├── requirements.txt                 # Pinned Python package dependencies
├── .env.example                     # Environment variables template
├── .env                             # Local development environment configuration
├── docker-compose.yml               # Neo4j 5.24 Community + APOC + Backend service
├── Dockerfile                       # Containerized backend build
└── README.md                        # Documentation
```

---

## 3. Technology Stack

- **Runtime**: Python 3.11+
- **Web Framework**: FastAPI, Uvicorn, Starlette
- **Database**: Neo4j Graph Database (Neo4j Python Driver 5.24+)
- **NLP / Machine Learning**: spaCy (`en_core_web_sm`)
- **Data Validation & Typing**: Pydantic v2
- **Testing**: Pytest, HTTPX

---

## 4. Neo4j Setup

### Option A: Via Docker Compose (Recommended)
From the `backend/` directory:
```bash
docker-compose up -d neo4j
```
This starts Neo4j 5.24 on:
- **Bolt Protocol**: `bolt://localhost:7687`
- **Neo4j Browser GUI**: `http://localhost:7474` (User: `neo4j`, Password: `atmograph123`)

### Option B: Local / Neo4j Desktop Instance
Create a database with:
- **Port**: `7687`
- **Username**: `neo4j`
- **Password**: `atmograph123` (or set custom credentials in `.env`)

---

## 5. Python Environment Setup & Installation

### 1. Create and Activate Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

---

## 6. Environment Variables

Create a `.env` file from the provided `.env.example`:

```ini
# Neo4j Database Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=atmograph123
NEO4J_DATABASE=neo4j

# Application Settings
ENVIRONMENT=development
DEBUG=True
API_V1_PREFIX=/api

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Graph Query Limits
GRAPH_DEFAULT_LIMIT=1000
GRAPH_MAX_LIMIT=5000

# spaCy Model
SPACY_MODEL=en_core_web_sm
```

---

## 7. Database Initialization & Graph Seeding

### Step 1: Initialize Database Constraints & Indexes
```bash
python scripts/init_neo4j.py
```
*Creates unique constraints on `n.id` for all labels (`Supplier`, `Manufacturer`, `Port`, `Warehouse`, `Distributor`, `Product`, `DisruptionEvent`) and performance indexes on `name`, `city`, `country`, and `risk`.*

### Step 2: Seed the Multi-Thousand Node Graph
```bash
python scripts/seed_graph.py --clean
```
*Generates and seeds **2,300+ nodes** and **7,900+ relationships** across global maritime ports, suppliers, manufacturers, warehouses, distributors, and products in ~5 seconds using batched `UNWIND` Cypher transactions.*

---

## 8. Starting the FastAPI Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/health`

---

## 9. API Endpoint Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Live Neo4j connection and server health check |
| `GET` | `/api/graph` | Paginated graph nodes & links (`limit`, `offset`, `type`, `risk`, `country`, `search`) |
| `GET` | `/api/graph/summary` | Aggregate graph metrics (node counts by label, risk distribution, country breakdown) |
| `GET` | `/api/graph/node/{node_id}` | Complete node metadata, incoming/outgoing edges, and historical disruptions |
| `GET` | `/api/entities` | Searchable directory of supply chain entities |
| `GET` | `/api/entities/{node_id}` | Detailed entity topology lookup |
| `GET` | `/api/risk/summary` | Network-wide risk level distribution and high-risk hotspots |
| `GET` | `/api/risk/nodes` | Filter nodes by risk tier (`level=CRITICAL\|HIGH\|MEDIUM\|LOW`) |
| `POST` | `/api/news/analyze` | Ingest news text, run spaCy NER, match nodes, update Neo4j, cascade ripple effects |
| `GET` | `/api/news/events` | List historical logged disruption events |

---

## 10. Example News Analysis Request

### Request:
`POST /api/news/analyze`
```json
{
  "text": "Due to a major port strike in Rotterdam, shipments from European electronics suppliers are experiencing severe delays and container vessel backlogs across the Netherlands.",
  "propagate_ripple": true
}
```

### Response:
```json
{
  "text": "Due to a major port strike in Rotterdam, shipments from European electronics suppliers...",
  "entities": [
    {
      "text": "Rotterdam",
      "label": "GPE",
      "start": 35,
      "end": 44,
      "normalized": "rotterdam"
    },
    {
      "text": "Netherlands",
      "label": "GPE",
      "start": 147,
      "end": 158,
      "normalized": "netherlands"
    }
  ],
  "severity": "HIGH",
  "severity_score": 0.65,
  "matched_keywords": ["strike", "severe delays", "delays"],
  "matched_nodes": [
    {
      "id": "PRT_0001",
      "name": "Port of Rotterdam",
      "label": "Port",
      "type": "Port",
      "country": "Netherlands",
      "city": "Rotterdam",
      "match_type": "city_match",
      "confidence": 0.95
    }
  ],
  "risk_updates": [
    {
      "id": "PRT_0001",
      "name": "Port of Rotterdam",
      "type": "Port",
      "previous_risk": "LOW",
      "new_risk": "HIGH",
      "previous_score": 0.23,
      "new_score": 0.58,
      "status": "DISRUPTED",
      "risk_reason": "Direct disruption impact from '['strike', 'severe delays']' alert (Severity: HIGH)"
    }
  ],
  "ripple_effects": [
    {
      "id": "MAN_01536",
      "name": "Orion Industrial Group #336",
      "label": "Manufacturer",
      "type": "Manufacturer",
      "parent_id": "PRT_0001",
      "parent_name": "Port of Rotterdam",
      "relationship": "SHIPS_TO",
      "previous_risk": "LOW",
      "new_risk": "MEDIUM",
      "previous_score": 0.17,
      "new_score": 0.35,
      "impact_reason": "Ripple delay propagated from upstream Port of Rotterdam"
    }
  ],
  "disruption_event_id": "DISRUPT_93A942B0",
  "timestamp": "2026-09-02T13:35:36.123456Z",
  "message": "Successfully analyzed news. Updated 1 primary node(s) and 6 downstream ripple node(s) with HIGH severity."
}
```

---

## 11. Mid-Project Review Demonstration Steps

To demonstrate the full end-to-end functionality for the Mid-Project Review:

```bash
# Run the automated demo pipeline CLI
python scripts/demo_pipeline.py
```

### What this demonstrates:
1. **spaCy Named Entity Recognition**: Extracts locations, organizations, and facilities from real disruption texts.
2. **Disruption Severity Scoring**: Categorizes events into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` using context-aware NLP.
3. **Graph Entity Matching**: Resolves extracted terms (e.g., `"Rotterdam"`, `"Shanghai"`, `"Hsinchu"`) to graph nodes in Neo4j using exact, city, country, and alias mapping.
4. **Dynamic Risk Transition**: Computes new quantitative risk scores ($0.0 - 1.0$) and updates qualitative tiers (`LOW` $\rightarrow$ `MEDIUM` $\rightarrow$ `HIGH` $\rightarrow$ `CRITICAL`).
5. **Downstream Ripple Effect**: Traverses outgoing supply-chain routes and propagates fractional risk elevation to connected manufacturers and warehouses.
6. **Neo4j Persistence & Audit Event**: Creates and links a `DisruptionEvent` node to affected nodes.

---

## 12. Automated Testing

Run the full pytest suite:
```bash
python -m pytest tests -v
```
All tests validate:
- spaCy NER extraction and entity normalization
- Synthetic supply-chain graph generator integrity
- FastAPI REST API routing, status codes, and input validation
