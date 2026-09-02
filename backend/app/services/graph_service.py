import logging
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


class GraphService:
    @staticmethod
    def get_graph(
        limit: int = 1000,
        offset: int = 0,
        node_type: Optional[str] = None,
        risk: Optional[str] = None,
        country: Optional[str] = None,
        search: Optional[str] = None,
    ) -> GraphResponse:
        """
        Retrieves graph nodes and their connecting relationships with filtering and pagination.
        """
        where_clauses = ["NOT n:DisruptionEvent"]
        params: Dict[str, Any] = {"limit": limit, "offset": offset}

        if node_type:
            where_clauses.append(f"n:{node_type}")
        if risk:
            where_clauses.append("n.risk = $risk")
            params["risk"] = risk.upper()
        if country:
            where_clauses.append("n.country = $country")
            params["country"] = country
        if search:
            where_clauses.append("(toLower(n.name) CONTAINS toLower($search) OR toLower(n.city) CONTAINS toLower($search))")
            params["search"] = search

        where_stmt = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Total node count matching filter
        count_query = f"MATCH (n){where_stmt} RETURN count(n) AS total"
        count_res = db.execute_read(count_query, params)
        total_nodes = count_res[0]["total"] if count_res else 0

        # Fetch nodes
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

        # Fetch connecting relationships between the returned nodes
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

        # Total relationships in the whole graph
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

    @staticmethod
    def get_graph_summary() -> GraphSummaryResponse:
        """
        Aggregates graph metrics: total counts, breakdown by node label, risk distribution,
        breakdown by country and industry.
        """
        # Node & edge counts
        count_res = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent
            RETURN count(n) AS node_count
        """)
        total_nodes = count_res[0]["node_count"] if count_res else 0

        edge_res = db.execute_read("""
            MATCH ()-[r]->() WHERE type(r) <> 'AFFECTS'
            RETURN count(r) AS edge_count
        """)
        total_relationships = edge_res[0]["edge_count"] if edge_res else 0

        # Nodes by label
        type_records = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent
            RETURN labels(n)[0] AS label, count(n) AS count
            ORDER BY count DESC
        """)
        nodes_by_type = {r["label"]: r["count"] for r in type_records if r["label"]}

        # Risk distribution
        risk_records = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent
            RETURN coalesce(n.risk, 'LOW') AS risk, count(n) AS count
        """)
        risk_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for r in risk_records:
            k = (r["risk"] or "LOW").upper()
            if k in risk_dict:
                risk_dict[k] = r["count"]

        # Nodes by country
        country_records = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent AND n.country IS NOT NULL
            RETURN n.country AS country, count(n) AS count
            ORDER BY count DESC LIMIT 15
        """)
        nodes_by_country = {r["country"]: r["count"] for r in country_records}

        # Nodes by industry
        industry_records = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent AND n.industry IS NOT NULL
            RETURN n.industry AS industry, count(n) AS count
            ORDER BY count DESC LIMIT 15
        """)
        nodes_by_industry = {r["industry"]: r["count"] for r in industry_records}

        # Disruption events count
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

    @staticmethod
    def get_node_detail(node_id: str) -> Optional[NodeDetailResponse]:
        """
        Fetches detailed properties, connected incoming & outgoing edges,
        and recent disruption events for a given node.
        """
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

    @staticmethod
    def get_risk_summary() -> RiskSummaryResponse:
        """Returns risk distribution and analytics across the graph."""
        res = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent
            RETURN count(n) AS total_nodes,
                   avg(n.risk_score) AS avg_score
        """)
        total_nodes = res[0]["total_nodes"] if res else 0
        avg_score = round(float(res[0]["avg_score"] or 0.0), 3) if res else 0.0

        # Distribution
        risk_res = db.execute_read("""
            MATCH (n) WHERE NOT n:DisruptionEvent
            RETURN coalesce(n.risk, 'LOW') AS risk, count(n) AS count
        """)
        dist_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for r in risk_res:
            k = (r["risk"] or "LOW").upper()
            if k in dist_dict:
                dist_dict[k] = r["count"]

        # Regions with High/Critical
        region_res = db.execute_read("""
            MATCH (n)
            WHERE NOT n:DisruptionEvent AND n.risk IN ['HIGH', 'CRITICAL'] AND n.country IS NOT NULL
            RETURN n.country AS region, count(n) AS count
            ORDER BY count DESC LIMIT 10
        """)
        highest_risk_regions = {r["region"]: r["count"] for r in region_res}

        # Industries with High/Critical
        ind_res = db.execute_read("""
            MATCH (n)
            WHERE NOT n:DisruptionEvent AND n.risk IN ['HIGH', 'CRITICAL'] AND n.industry IS NOT NULL
            RETURN n.industry AS industry, count(n) AS count
            ORDER BY count DESC LIMIT 10
        """)
        highest_risk_industries = {r["industry"]: r["count"] for r in ind_res}

        return RiskSummaryResponse(
            total_nodes=total_nodes,
            risk_distribution=RiskDistribution(**dist_dict),
            average_risk_score=avg_score,
            highest_risk_regions=highest_risk_regions,
            highest_risk_industries=highest_risk_industries,
        )

    @staticmethod
    def get_risk_nodes(
        level: Optional[RiskLevel] = None,
        limit: int = 50,
        offset: int = 0
    ) -> RiskNodesResponse:
        """Returns nodes filtered by risk level, sorted by risk score descending."""
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


graph_service = GraphService()
