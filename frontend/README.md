# AtmoGraph Frontend – Supply Chain Ripple Effect Intelligence

> **Enterprise React + TypeScript Supply Chain Risk Analysis Dashboard**  
> *Week 1 (UI Foundations & Graph Workspace) & Week 2 (Interactive Graph & Disruption Analysis)*

---

## 1. Project Overview

The **AtmoGraph Frontend** is an analyst dashboard designed to visualize complex global multi-tier supply networks, monitor operational risk states, and analyze real-world disruption intelligence.

### Scope Delivered:
- **Week 1 – UI Foundations**: Enterprise dark analytics interface, header with live Neo4j and FastAPI health indicators, sidebar navigation, multi-dimensional filter bar, and summary metric cards.
- **Week 2 – Interactive Graph Workspace**: React Flow canvas with custom nodes, directional edges, zoom/pan/minimap controls, slide-out node details drawer, and subnetwork filtering.
- **Week 2 – Disruption Analysis Workbench**: Natural Language Processing (NLP) news ingestion interface with sample disruption presets, spaCy entity chips, matched Neo4j graph entities, dynamic risk state transitions (`LOW` $\rightarrow$ `HIGH`), and downstream ripple cascades.
- **Mid-Project Review**: High-performance rendering of thousands of interconnected nodes, zero fake data, full backend API bindings, and clean error handling.

---

## 2. Technology Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **Graph Visualization**: React Flow (`reactflow` v11)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 3. Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Logo, subtitle, API & Neo4j status indicators, refresh action
│   │   │   ├── Sidebar.tsx          # Navigation tabs & threat metrics
│   │   │   └── FilterPanel.tsx      # Type, risk, country, search, and limit filters
│   │   │
│   │   ├── graph/
│   │   │   ├── GraphCanvas.tsx      # Main React Flow workspace with MiniMap and Controls
│   │   │   ├── CustomNode.tsx       # Lightweight canvas node with risk indicators
│   │   │   ├── NodeDetailsDrawer.tsx# Slide-out inspector with metadata and routes
│   │   │   └── GraphToolbar.tsx     # Zoom, fit view, node count badge, and reset filters
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx         # Enterprise metric card component
│   │   │   ├── SummaryCards.tsx     # Summary metrics row powered by live API data
│   │   │   └── HotspotsList.tsx     # Top elevated risk hotspots drawer
│   │   │
│   │   ├── news/
│   │   │   ├── NewsAnalysisForm.tsx # News input form with disruption presets
│   │   │   ├── ExtractedEntitiesView.tsx # spaCy NER entity chips
│   │   │   ├── MatchedNodesView.tsx # Matched Neo4j nodes with confidence ratings
│   │   │   └── RiskChangesView.tsx  # Dynamic risk shifts and downstream ripple cascade
│   │   │
│   │   └── common/
│   │       ├── Badge.tsx            # Accessible risk & node type badges
│   │       ├── LoadingState.tsx     # Loading spinner
│   │       ├── ErrorState.tsx       # Error recovery with retry action
│   │       └── EmptyState.tsx       # Zero-data state
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx            # Main overview combining Graph workspace and metrics
│   │   └── Analysis.tsx             # Disruption Intelligence & NLP workbench
│   │
│   ├── services/
│   │   └── api.ts                   # Central Axios client integrating with FastAPI backend
│   │
│   ├── hooks/
│   │   ├── useGraph.ts              # Graph fetching, pagination, and node selection
│   │   ├── useRisk.ts               # Risk summary metrics and hotspot analytics
│   │   ├── useNewsAnalysis.ts       # Disruption analysis mutation and preset loader
│   │   └── useHealth.ts             # Health polling for FastAPI and Neo4j connectivity
│   │
│   ├── types/
│   │   ├── graph.ts                 # TypeScript interfaces for nodes, edges, subgraphs
│   │   ├── risk.ts                  # Risk levels, node statuses, distribution schemas
│   │   └── news.ts                  # Extracted entities, matched nodes, ripple items
│   │
│   ├── utils/
│   │   ├── graphLayout.ts           # Hierarchical node layout positioning for React Flow
│   │   └── formatters.ts            # Formatting helpers for risk colors, types, timestamps
│   │
│   ├── App.tsx                      # Root shell with layout and active tab routing
│   ├── main.tsx                     # React 18 DOM root
│   └── index.css                    # Tailwind directives and dark theme tokens
│
├── .env.example                     # VITE_API_BASE_URL=http://localhost:8000/api
├── .env                             # Local frontend configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration with proxy
└── README.md                        # Documentation
```

---

## 4. Installation & Setup

### 1. Install Dependencies
From the `frontend/` directory:
```bash
npm install
```

### 2. Configure Environment
Verify `.env` has the backend API URL:
```ini
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Build Production Bundle
```bash
npm run build
```

---

## 5. Available Features & Pages

### 1. Dashboard Overview (`Dashboard.tsx`)
- **Live Summary Metrics**: Real-time total node count, active route count, critical threat count, elevated risk count, and network average risk score.
- **Multi-Dimensional Filter Bar**: Real-time filtering by Node Type (`Supplier`, `Manufacturer`, `Port`, `Warehouse`, `Distributor`, `Product`), Risk Tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Country, Keyword Search, and Graph Limit.
- **Interactive React Flow Graph**:
  - Smooth pan and zoom ($0.05\times - 2.5\times$).
  - MiniMap navigation.
  - Node selection and high-contrast edge highlighting.
- **Node Details Inspector**: Slide-out drawer displaying node properties, risk score with progress bar, incoming routes, outgoing routes, and attached historical disruption events.

### 2. Supply Chain Graph Workspace
- Full-screen dedicated graph exploration workspace with all filtering, search, and inspector tools.

### 3. Disruption Analysis Workbench (`Analysis.tsx`)
- **News Ingestion Form**: Textarea input with quick-load presets (Rotterdam Strike, Taiwan Semiconductor Earthquake, Shanghai Typhoon, Hamburg Backlog, Houston Explosion).
- **Extracted spaCy Entities**: Visual chips displaying detected entities, NER labels (`GPE`, `LOC`, `FAC`, `ORG`), and normalized names.
- **Matched Neo4j Entities**: Cards linking to graph nodes with match type (`city_match`, `name_match`, `alias_match`) and confidence ratings.
- **Primary Risk State Shifts**: Visual before $\rightarrow$ after transition cards (`LOW` $\rightarrow$ `HIGH`, Score $0.23 \rightarrow 0.58$, Status `OPERATIONAL` $\rightarrow$ `DISRUPTED`).
- **Downstream Ripple Cascade**: Displays cascaded delay effects on direct downstream manufacturers and warehouses.
- **Historical Event Logs**: Timeline of disruption events recorded in the database.

---

## 6. Mid-Project Review Demonstration Checklist

1. **Graph Loads from Backend**: Open Dashboard; verify nodes and relationships load from `GET /api/graph`.
2. **Interconnected Graph Navigation**: Zoom and pan smoothly across supply-chain tiers.
3. **Node Selection & Inspector**: Click on any node (e.g. `Port of Rotterdam` or `TSMC`); verify the right-side inspector opens with properties, risk scores, incoming routes, and outgoing routes.
4. **Subnetwork Filtering**: Use the filter dropdowns to isolate `Port` nodes or `HIGH` risk entities.
5. **Disruption News Analysis**: Navigate to **Disruption Analysis** tab $\rightarrow$ click **Rotterdam Port Strike** preset $\rightarrow$ click **Analyze Disruption** $\rightarrow$ verify spaCy extracted entities, matched Neo4j nodes, risk updates, and ripple effects appear.
6. **Ripple Navigation**: Click **View in Graph** on any affected entity to seamlessly highlight that node in the graph workspace.
