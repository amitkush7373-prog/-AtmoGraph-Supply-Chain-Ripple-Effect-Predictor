import logging
from typing import Any, Dict, List, Optional
from app.core.database import db, Neo4jConnectionError

logger = logging.getLogger("atmograph.neo4j_service")

NODE_LABELS = ["Supplier", "Manufacturer", "Port", "Warehouse", "Distributor", "Product", "DisruptionEvent"]


class Neo4jService:
    @staticmethod
    def create_constraints_and_indexes() -> Dict[str, Any]:
        """Creates unique constraints and lookup indexes on node labels."""
        results = {"constraints": [], "indexes": []}
        
        # 1. Unique ID constraints for each label
        for label in NODE_LABELS:
            constraint_name = f"constraint_{label.lower()}_id"
            query = f"""
                CREATE CONSTRAINT {constraint_name} IF NOT EXISTS
                FOR (n:{label})
                REQUIRE n.id IS UNIQUE
            """
            try:
                db.execute_write(query)
                results["constraints"].append(constraint_name)
                logger.info(f"Ensured constraint on {label}.id")
            except Exception as e:
                logger.error(f"Error creating constraint on {label}.id: {e}")

        # 2. Indexes for search and matching
        indexes = [
            ("index_node_name", "Supplier", "name"),
            ("index_node_city", "Supplier", "city"),
            ("index_node_country", "Supplier", "country"),
            ("index_port_name", "Port", "name"),
            ("index_port_city", "Port", "city"),
            ("index_port_country", "Port", "country"),
            ("index_man_city", "Manufacturer", "city"),
            ("index_man_country", "Manufacturer", "country"),
            ("index_wh_city", "Warehouse", "city"),
            ("index_wh_country", "Warehouse", "country"),
            ("index_risk", "Supplier", "risk"),
        ]

        for index_name, label, prop in indexes:
            query = f"""
                CREATE INDEX {index_name} IF NOT EXISTS
                FOR (n:{label})
                ON (n.{prop})
            """
            try:
                db.execute_write(query)
                results["indexes"].append(index_name)
            except Exception as e:
                logger.error(f"Error creating index {index_name}: {e}")

        return results

    @staticmethod
    def batch_insert_nodes(label: str, nodes: List[Dict[str, Any]], batch_size: int = 500) -> int:
        """Inserts or updates nodes in batches using UNWIND MERGE."""
        if not nodes:
            return 0

        query = f"""
            UNWIND $rows AS row
            MERGE (n:{label} {{id: row.id}})
            SET n.name = row.name,
                n.type = coalesce(row.type, '{label}'),
                n.country = row.country,
                n.city = row.city,
                n.region = row.region,
                n.industry = row.industry,
                n.risk = row.risk,
                n.risk_score = row.risk_score,
                n.status = row.status,
                n.risk_reason = row.risk_reason,
                n.updated_at = row.updated_at,
                n.latitude = row.latitude,
                n.longitude = row.longitude
        """

        total_inserted = 0
        for i in range(0, len(nodes), batch_size):
            batch = nodes[i : i + batch_size]
            db.execute_write(query, {"rows": batch})
            total_inserted += len(batch)

        logger.info(f"Loaded {total_inserted} {label} nodes into Neo4j.")
        return total_inserted

    @staticmethod
    def batch_insert_edges(rel_type: str, edges: List[Dict[str, Any]], batch_size: int = 500) -> int:
        """Inserts or updates relationships in batches using UNWIND MERGE."""
        if not edges:
            return 0

        query = f"""
            UNWIND $rows AS row
            MATCH (a {{id: row.source}})
            MATCH (b {{id: row.target}})
            MERGE (a)-[r:{rel_type} {{id: row.id}}]->(b)
            SET r.type = row.type,
                r.relationship = row.type,
                r.lead_time_days = row.lead_time_days,
                r.risk_score = row.risk_score,
                r.status = row.status
        """

        total_inserted = 0
        for i in range(0, len(edges), batch_size):
            batch = edges[i : i + batch_size]
            db.execute_write(query, {"rows": batch})
            total_inserted += len(batch)

        logger.info(f"Loaded {total_inserted} {rel_type} edges into Neo4j.")
        return total_inserted


neo4j_service = Neo4jService()
