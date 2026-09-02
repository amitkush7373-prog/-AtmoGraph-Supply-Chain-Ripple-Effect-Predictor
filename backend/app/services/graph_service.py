import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.database import db
from app.models.graph_models import (
    GraphNode, GraphEdge, GraphResponse, GraphSummaryResponse,
    NodeDetailResponse, ConnectedNode, DisruptionEventSummary
)
from app.models.risk_models import (
    RiskLevel, RiskDistribution, RiskSummaryResponse, RiskNodeItem, RiskNodesResponse
)

logger = logging.getLogger("atmograph.graph_service")

DATA_DIR = Path(__file__).parent.parent.parent / "data"
NODES_PATH = DATA_DIR / "nodes.json"
EDGES_PATH = DATA_DIR / "edges.json"


class GraphService:
    _cached_nodes: Optional[List[Dict[str, Any]]] = None
    _cached_edges: Optional[List[Dict[str, Any]]] = None

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
    def get_graph(
        cls,
        limit: int = 1000,
        offset: int = 0,
        node_type: Optional[str] = None,
        risk: Optional[str] = None,
        country: Optional[str] = None,
        search: Optional[str] = None,
    ) -> GraphResponse:
        """
        Retrieves graph nodes and their connecting relationships with filtering and pagination.
        Uses live Neo4j if available, or seamlessly falls back to the local dataset.
        """
        if db.is_connected():
            try:
                return cls._get_graph_from_neo4j(limit, offset, node_type, risk, country, search)
            except Exception as e:
                logger.warning(f"Neo4j query failed, falling back to local dataset: {e}")

        return cls._get_graph_from_local(limit, offset, node_type, risk, country, search)

    @classmethod
    def _get_graph_from_neo4j(
        cls,
        limit: int,
        offset: int,
        node_type: Optional[str],
        risk: Optional[str],
        country: Optional[str],
        search: Optional[str],
    ) -> GraphResponse:
        where_clauses = ["NOT n:DisruptionEvent"]
        params: Dict[str, Any] = {"limit": limit, "offset": offset}

        if node_type and node_type.upper() != "ALL":
            where_clauses.append(f"n:{node_type}")
        if risk and risk.upper() != "ALL":
            where_clauses.append("n.risk = $risk")
            params["risk"] = risk.upper()
        if country:
            where_clauses.append("n.country = $country")
            params["country"] = country
        if search:
            where_clauses.append("(toLower(n.name) CONTAINS toLower($search) OR toLower(n.city) CONTAINS toLower($search))")
            params["search"] = search

        where_stmt = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        count_query = f"MATCH (n){where_stmt} RETURN count(n) AS total"
        count_res = db.execute_read(count_query, params)
        total_nodes = count_res[0]["total"] if count_res else 0

        nodes_query = f"""
            MATCH (n){where_stmt}
            RETURN n.id AS id,
                   coalesce(labels(n)[0], 'Unknown') AS label,
                   coalesce(n.type, labels(n)[0]) AS type,
                   n.name AS name,
                   n.country AS country,
                   n.city AS city,
                   n.region AS region,
                   n.industry AS industry,
                   coalesce(n.risk, 'LOW') AS risk,
                   coalesce(n.risk_score, 0.1) AS risk_score,
                   coalesce(n.status, 'OPERATIONAL') AS status,
                   n.risk_reason AS risk_reason,
                   n.updated_at AS updated_at,
                   n.latitude AS latitude,
                   n.longitude AS longitude
            ORDER BY n.risk_score DESC, n.id ASC
            SKIP $offset LIMIT $limit
        """
        nodes_records = db.execute_read(nodes_query, params)
        nodes = [GraphNode(**r) for r in nodes_records]
        node_ids = [n.id for n in nodes]

        if not node_ids:
            return GraphResponse(
                nodes=[],
                links=[],
                total_nodes=total_nodes,
                total_links=0,
                limit=limit,
                offset=offset,
            )

        links_query = """
            MATCH (a)-[r]->(b)
            WHERE a.id IN $node_ids AND b.id IN $node_ids AND type(r) <> 'AFFECTS'
            RETURN coalesce(r.id, id(r)) AS id,
                   a.id AS source,
                   b.id AS target,
                   type(r) AS type,
                   type(r) AS relationship,
                   coalesce(r.lead_time_days, 7) AS lead_time_days,
                   coalesce(r.risk_score, 0.1) AS risk_score,
                   coalesce(r.status, 'NORMAL') AS status
        """
        links_records = db.execute_read(links_query, {"node_ids": node_ids})
        links = [GraphEdge(**r) for r in links_records]

        total_links_res = db.execute_read("MATCH ()-[r]->() WHERE type(r) <> 'AFFECTS' RETURN count(r) AS total")
        total_links = total_links_res[0]["total"] if total_links_res else len(links)

        return GraphResponse(
            nodes=nodes,
            links=links,
            total_nodes=total_nodes,
            total_links=total_links,
            limit=limit,
            offset=offset,
        )

    @classmethod
    def _get_graph_from_local(
        cls,
        limit: int,
        offset: int,
        node_type: Optional[str],
        risk: Optional[str],
        country: Optional[str],
        search: Optional[str],
    ) -> GraphResponse:
        raw_nodes, raw_edges = cls._load_local_dataset()

        filtered_nodes = raw_nodes
        if node_type and node_type.upper() != "ALL":
            filtered_nodes = [n for n in filtered_nodes if n.get("type", "").lower() == node_type.lower() or n.get("label", "").lower() == node_type.lower()]
        if risk and risk.upper() != "ALL":
            filtered_nodes = [n for n in filtered_nodes if n.get("risk", "LOW").upper() == risk.upper()]
        if country:
            filtered_nodes = [n for n in filtered_nodes if country.lower() in (n.get("country") or "").lower()]
        if search:
            s = search.lower()
            filtered_nodes = [n for n in filtered_nodes if s in n.get("name", "").lower() or s in n.get("city", "").lower() or s in n.get("id", "").lower()]

        total_nodes = len(filtered_nodes)

        # When viewing all types, ensure balanced representation across all 6 tiers
        if not node_type or node_type.upper() == "ALL":
            tier_buckets: Dict[str, List[Dict[str, Any]]] = {
                "Supplier": [],
                "Manufacturer": [],
                "Port": [],
                "Warehouse": [],
                "Distributor": [],
                "Product": [],
            }
            for n in filtered_nodes:
                t = n.get("type") or n.get("label") or "Supplier"
                if t in tier_buckets:
                    tier_buckets[t].append(n)
                else:
                    tier_buckets["Supplier"].append(n)

            # Proportional distribution across tiers
            allocations = {
                "Supplier": max(2, int(limit * 0.28)),
                "Manufacturer": max(2, int(limit * 0.22)),
                "Port": max(2, int(limit * 0.14)),
                "Warehouse": max(2, int(limit * 0.14)),
                "Distributor": max(2, int(limit * 0.12)),
                "Product": max(2, int(limit * 0.10)),
            }

            paged_nodes: List[Dict[str, Any]] = []
            for t, count in allocations.items():
                paged_nodes.extend(tier_buckets[t][:count])

            paged_nodes = paged_nodes[:limit]
        else:
            paged_nodes = filtered_nodes[offset : offset + limit]

        graph_nodes = []
        for n in paged_nodes:
            graph_nodes.append(GraphNode(
                id=n.get("id", ""),
                label=n.get("label") or n.get("type") or "Unknown",
                type=n.get("type") or n.get("label") or "Unknown",
                name=n.get("name", ""),
                country=n.get("country"),
                city=n.get("city"),
                region=n.get("region"),
                industry=n.get("industry"),
                risk=n.get("risk", "LOW"),
                risk_score=n.get("risk_score", 0.1),
                status=n.get("status", "OPERATIONAL"),
                risk_reason=n.get("risk_reason"),
                updated_at=n.get("updated_at"),
                latitude=n.get("latitude"),
                longitude=n.get("longitude"),
            ))

        node_id_set = {n.id for n in graph_nodes}
        graph_links = []
        for e in raw_edges:
            if e.get("source") in node_id_set and e.get("target") in node_id_set:
                graph_links.append(GraphEdge(
                    id=e.get("id", f"{e.get('source')}_{e.get('target')}"),
                    source=e.get("source", ""),
                    target=e.get("target", ""),
                    type=e.get("type", e.get("relationship", "SHIPS_TO")),
                    relationship=e.get("relationship", e.get("type", "SHIPS_TO")),
                    lead_time_days=e.get("lead_time_days", 7),
                    risk_score=e.get("risk_score", 0.1),
                    status=e.get("status", "NORMAL"),
                ))

        return GraphResponse(
            nodes=graph_nodes,
            links=graph_links,
            total_nodes=total_nodes,
            total_links=len(raw_edges),
            limit=limit,
            offset=offset,
        )

    @classmethod
    def get_graph_summary(cls) -> GraphSummaryResponse:
        """Aggregates graph metrics."""
        if db.is_connected():
            try:
                return cls._get_graph_summary_from_neo4j()
            except Exception as e:
                logger.warning(f"Neo4j summary failed, using local dataset: {e}")

        return cls._get_graph_summary_from_local()

    @classmethod
    def _get_graph_summary_from_neo4j(cls) -> GraphSummaryResponse:
        count_res = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent RETURN count(n) AS node_count")
        total_nodes = count_res[0]["node_count"] if count_res else 0

        edge_res = db.execute_read("MATCH ()-[r]->() WHERE type(r) <> 'AFFECTS' RETURN count(r) AS edge_count")
        total_relationships = edge_res[0]["edge_count"] if edge_res else 0

        type_records = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC")
        nodes_by_type = {r["label"]: r["count"] for r in type_records if r["label"]}

        risk_records = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent RETURN coalesce(n.risk, 'LOW') AS risk, count(n) AS count")
        risk_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for r in risk_records:
            k = (r["risk"] or "LOW").upper()
            if k in risk_dict:
                risk_dict[k] = r["count"]

        country_records = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent AND n.country IS NOT NULL RETURN n.country AS country, count(n) AS count ORDER BY count DESC LIMIT 15")
        nodes_by_country = {r["country"]: r["count"] for r in country_records}

        industry_records = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent AND n.industry IS NOT NULL RETURN n.industry AS industry, count(n) AS count ORDER BY count DESC LIMIT 15")
        nodes_by_industry = {r["industry"]: r["count"] for r in industry_records}

        disrupt_res = db.execute_read("MATCH (d:DisruptionEvent) RETURN count(d) AS event_count")
        events_count = disrupt_res[0]["event_count"] if disrupt_res else 0

        return GraphSummaryResponse(
            total_nodes=total_nodes,
            total_relationships=total_relationships,
            nodes_by_type=nodes_by_type,
            risk_distribution=RiskDistribution(**risk_dict),
            nodes_by_country=nodes_by_country,
            nodes_by_industry=nodes_by_industry,
            recent_disruptions_count=events_count,
        )

    @classmethod
    def _get_graph_summary_from_local(cls) -> GraphSummaryResponse:
        nodes, edges = cls._load_local_dataset()

        nodes_by_type: Dict[str, int] = {}
        risk_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        nodes_by_country: Dict[str, int] = {}
        nodes_by_industry: Dict[str, int] = {}

        for n in nodes:
            t = n.get("type") or n.get("label") or "Unknown"
            nodes_by_type[t] = nodes_by_type.get(t, 0) + 1

            r = (n.get("risk") or "LOW").upper()
            if r in risk_dict:
                risk_dict[r] += 1

            c = n.get("country")
            if c:
                nodes_by_country[c] = nodes_by_country.get(c, 0) + 1

            ind = n.get("industry")
            if ind:
                nodes_by_industry[ind] = nodes_by_industry.get(ind, 0) + 1

        return GraphSummaryResponse(
            total_nodes=len(nodes),
            total_relationships=len(edges),
            nodes_by_type=nodes_by_type,
            risk_distribution=RiskDistribution(**risk_dict),
            nodes_by_country=dict(sorted(nodes_by_country.items(), key=lambda x: x[1], reverse=True)[:15]),
            nodes_by_industry=dict(sorted(nodes_by_industry.items(), key=lambda x: x[1], reverse=True)[:15]),
            recent_disruptions_count=0,
        )

    @classmethod
    def get_node_detail(cls, node_id: str) -> Optional[NodeDetailResponse]:
        """Fetches detailed properties, connected edges, and disruption history."""
        if db.is_connected():
            try:
                res = cls._get_node_detail_from_neo4j(node_id)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Neo4j node detail failed, using local: {e}")

        return cls._get_node_detail_from_local(node_id)

    @classmethod
    def _get_node_detail_from_neo4j(cls, node_id: str) -> Optional[NodeDetailResponse]:
        query = """
            MATCH (n {id: $node_id})
            OPTIONAL MATCH (n)-[r_out]->(out) WHERE type(r_out) <> 'AFFECTS'
            OPTIONAL MATCH (in_node)-[r_in]->(n) WHERE type(r_in) <> 'AFFECTS'
            OPTIONAL MATCH (d:DisruptionEvent)-[a:AFFECTS]->(n)
            RETURN n.id AS id,
                   labels(n)[0] AS label,
                   coalesce(n.type, labels(n)[0]) AS type,
                   n.name AS name,
                   n.country AS country,
                   n.city AS city,
                   n.industry AS industry,
                   coalesce(n.risk, 'LOW') AS risk,
                   coalesce(n.risk_score, 0.1) AS risk_score,
                   coalesce(n.status, 'OPERATIONAL') AS status,
                   n.risk_reason AS risk_reason,
                   n.updated_at AS updated_at,
                   collect(DISTINCT {
                       id: out.id,
                       name: out.name,
                       label: labels(out)[0],
                       relationship: type(r_out),
                       direction: 'outgoing',
                       lead_time_days: r_out.lead_time_days,
                       risk: out.risk,
                       risk_score: out.risk_score,
                       status: out.status
                   }) AS outgoing,
                   collect(DISTINCT {
                       id: in_node.id,
                       name: in_node.name,
                       label: labels(in_node)[0],
                       relationship: type(r_in),
                       direction: 'incoming',
                       lead_time_days: r_in.lead_time_days,
                       risk: in_node.risk,
                       risk_score: in_node.risk_score,
                       status: in_node.status
                   }) AS incoming,
                   collect(DISTINCT {
                       id: d.id,
                       title: d.title,
                       severity: d.severity,
                       timestamp: d.timestamp,
                       risk_delta: a.risk_delta
                   }) AS disruptions
        """
        records = db.execute_read(query, {"node_id": node_id})
        if not records or not records[0]["id"]:
            return None

        record = records[0]
        outgoing = [ConnectedNode(**c) for c in record["outgoing"] if c.get("id")]
        incoming = [ConnectedNode(**c) for c in record["incoming"] if c.get("id")]
        disruptions = [DisruptionEventSummary(**d) for d in record["disruptions"] if d.get("id")]

        return NodeDetailResponse(
            id=record["id"],
            name=record["name"],
            label=record["label"],
            type=record["type"],
            country=record.get("country"),
            city=record.get("city"),
            industry=record.get("industry"),
            risk=record["risk"],
            risk_score=record["risk_score"],
            status=record["status"],
            risk_reason=record.get("risk_reason"),
            updated_at=record.get("updated_at"),
            incoming_connections=incoming,
            outgoing_connections=outgoing,
            total_connections=len(incoming) + len(outgoing),
            recent_disruptions=disruptions,
        )

    @classmethod
    def _get_node_detail_from_local(cls, node_id: str) -> Optional[NodeDetailResponse]:
        nodes, edges = cls._load_local_dataset()
        target = next((n for n in nodes if n.get("id") == node_id), None)
        if not target:
            return None

        node_map = {n["id"]: n for n in nodes}

        incoming: List[ConnectedNode] = []
        outgoing: List[ConnectedNode] = []

        for e in edges:
            if e.get("source") == node_id:
                tgt = node_map.get(e.get("target"))
                if tgt:
                    outgoing.append(ConnectedNode(
                        id=tgt["id"],
                        name=tgt["name"],
                        label=tgt.get("label", tgt.get("type", "Unknown")),
                        relationship=e.get("relationship", e.get("type", "SHIPS_TO")),
                        direction="outgoing",
                        lead_time_days=e.get("lead_time_days", 7),
                        risk=tgt.get("risk", "LOW"),
                        risk_score=tgt.get("risk_score", 0.1),
                        status=tgt.get("status", "OPERATIONAL"),
                    ))
            elif e.get("target") == node_id:
                src = node_map.get(e.get("source"))
                if src:
                    incoming.append(ConnectedNode(
                        id=src["id"],
                        name=src["name"],
                        label=src.get("label", src.get("type", "Unknown")),
                        relationship=e.get("relationship", e.get("type", "SUPPLIES")),
                        direction="incoming",
                        lead_time_days=e.get("lead_time_days", 7),
                        risk=src.get("risk", "LOW"),
                        risk_score=src.get("risk_score", 0.1),
                        status=src.get("status", "OPERATIONAL"),
                    ))

        return NodeDetailResponse(
            id=target["id"],
            name=target["name"],
            label=target.get("label", target.get("type", "Unknown")),
            type=target.get("type", target.get("label", "Unknown")),
            country=target.get("country"),
            city=target.get("city"),
            industry=target.get("industry"),
            risk=target.get("risk", "LOW"),
            risk_score=target.get("risk_score", 0.1),
            status=target.get("status", "OPERATIONAL"),
            risk_reason=target.get("risk_reason"),
            updated_at=target.get("updated_at"),
            incoming_connections=incoming,
            outgoing_connections=outgoing,
            total_connections=len(incoming) + len(outgoing),
            recent_disruptions=[],
        )

    @classmethod
    def get_risk_summary(cls) -> RiskSummaryResponse:
        """Returns risk distribution and analytics across the graph."""
        if db.is_connected():
            try:
                return cls._get_risk_summary_from_neo4j()
            except Exception as e:
                logger.warning(f"Neo4j risk summary failed, using local: {e}")

        return cls._get_risk_summary_from_local()

    @classmethod
    def _get_risk_summary_from_neo4j(cls) -> RiskSummaryResponse:
        res = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent RETURN count(n) AS total_nodes, avg(n.risk_score) AS avg_score")
        total_nodes = res[0]["total_nodes"] if res else 0
        avg_score = round(float(res[0]["avg_score"] or 0.0), 3) if res else 0.0

        risk_res = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent RETURN coalesce(n.risk, 'LOW') AS risk, count(n) AS count")
        dist_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for r in risk_res:
            k = (r["risk"] or "LOW").upper()
            if k in dist_dict:
                dist_dict[k] = r["count"]

        region_res = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent AND n.risk IN ['HIGH', 'CRITICAL'] AND n.country IS NOT NULL RETURN n.country AS region, count(n) AS count ORDER BY count DESC LIMIT 10")
        highest_risk_regions = {r["region"]: r["count"] for r in region_res}

        ind_res = db.execute_read("MATCH (n) WHERE NOT n:DisruptionEvent AND n.risk IN ['HIGH', 'CRITICAL'] AND n.industry IS NOT NULL RETURN n.industry AS industry, count(n) AS count ORDER BY count DESC LIMIT 10")
        highest_risk_industries = {r["industry"]: r["count"] for r in ind_res}

        return RiskSummaryResponse(
            total_nodes=total_nodes,
            risk_distribution=RiskDistribution(**dist_dict),
            average_risk_score=avg_score,
            highest_risk_regions=highest_risk_regions,
            highest_risk_industries=highest_risk_industries,
        )

    @classmethod
    def _get_risk_summary_from_local(cls) -> RiskSummaryResponse:
        nodes, _ = cls._load_local_dataset()
        dist_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        total_score = 0.0
        regions: Dict[str, int] = {}
        industries: Dict[str, int] = {}

        for n in nodes:
            r = (n.get("risk") or "LOW").upper()
            if r in dist_dict:
                dist_dict[r] += 1
            score = float(n.get("risk_score", 0.1))
            total_score += score

            if r in ["HIGH", "CRITICAL"]:
                c = n.get("country")
                if c:
                    regions[c] = regions.get(c, 0) + 1
                ind = n.get("industry")
                if ind:
                    industries[ind] = industries.get(ind, 0) + 1

        avg_score = round(total_score / len(nodes), 3) if nodes else 0.12

        return RiskSummaryResponse(
            total_nodes=len(nodes),
            risk_distribution=RiskDistribution(**dist_dict),
            average_risk_score=avg_score,
            highest_risk_regions=regions,
            highest_risk_industries=industries,
        )

    @classmethod
    def get_risk_nodes(
        cls,
        level: Optional[RiskLevel] = None,
        limit: int = 50,
        offset: int = 0
    ) -> RiskNodesResponse:
        """Returns nodes filtered by risk level."""
        if db.is_connected():
            try:
                return cls._get_risk_nodes_from_neo4j(level, limit, offset)
            except Exception as e:
                logger.warning(f"Neo4j risk nodes failed, using local: {e}")

        return cls._get_risk_nodes_from_local(level, limit, offset)

    @classmethod
    def _get_risk_nodes_from_neo4j(cls, level: Optional[RiskLevel], limit: int, offset: int) -> RiskNodesResponse:
        params: Dict[str, Any] = {"limit": limit, "offset": offset}
        where_clause = "WHERE NOT n:DisruptionEvent"
        if level:
            where_clause += " AND n.risk = $level"
            params["level"] = level.value

        count_res = db.execute_read(f"MATCH (n) {where_clause} RETURN count(n) AS total", params)
        total = count_res[0]["total"] if count_res else 0

        query = f"""
            MATCH (n) {where_clause}
            RETURN n.id AS id,
                   n.name AS name,
                   coalesce(n.type, labels(n)[0]) AS type,
                   n.country AS country,
                   n.city AS city,
                   n.industry AS industry,
                   coalesce(n.risk, 'LOW') AS risk,
                   coalesce(n.risk_score, 0.1) AS risk_score,
                   coalesce(n.status, 'OPERATIONAL') AS status,
                   n.risk_reason AS risk_reason,
                   n.updated_at AS updated_at
            ORDER BY n.risk_score DESC, n.id ASC
            SKIP $offset LIMIT $limit
        """
        records = db.execute_read(query, params)
        items = [RiskNodeItem(**r) for r in records]

        return RiskNodesResponse(
            level=level,
            total=total,
            limit=limit,
            offset=offset,
            nodes=items,
        )

    @classmethod
    def _get_risk_nodes_from_local(cls, level: Optional[RiskLevel], limit: int, offset: int) -> RiskNodesResponse:
        nodes, _ = cls._load_local_dataset()
        filtered = nodes
        if level:
            filtered = [n for n in filtered if (n.get("risk") or "LOW").upper() == level.value]

        filtered.sort(key=lambda n: float(n.get("risk_score", 0.0)), reverse=True)
        paged = filtered[offset : offset + limit]

        items = [
            RiskNodeItem(
                id=n.get("id", ""),
                name=n.get("name", ""),
                type=n.get("type") or n.get("label") or "Unknown",
                country=n.get("country"),
                city=n.get("city"),
                industry=n.get("industry"),
                risk=n.get("risk", "LOW"),
                risk_score=n.get("risk_score", 0.1),
                status=n.get("status", "OPERATIONAL"),
                risk_reason=n.get("risk_reason"),
                updated_at=n.get("updated_at"),
            )
            for n in paged
        ]

        return RiskNodesResponse(
            level=level,
            total=len(filtered),
            limit=limit,
            offset=offset,
            nodes=items,
        )


graph_service = GraphService()
