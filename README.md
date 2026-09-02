# AtmoGraph – Supply Chain Ripple Effect Predictor

AtmoGraph is an intelligent graph-native supply-chain risk analysis system.

## Project Structure

```
AtmoGraph/
├── backend/            # FastAPI, Neo4j, spaCy NLP & Graph Risk Analysis Engine
└── frontend/           # React + Vite Interactive Graph Visualization & Risk Dashboard
```

## Quick Start (Backend)

For complete backend documentation, installation guides, and review demonstration steps:
👉 **[Read Backend README](backend/README.md)**

```bash
# 1. Start Neo4j
cd backend
docker-compose up -d neo4j

# 2. Seed Graph (2,300+ nodes)
python scripts/seed_graph.py

# 3. Start Backend Server
uvicorn app.main:app --reload --port 8000

# 4. Run Mid-Review Demo Pipeline
python scripts/demo_pipeline.py
```
