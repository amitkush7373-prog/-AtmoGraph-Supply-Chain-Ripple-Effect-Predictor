#!/usr/bin/env python3
"""
AtmoGraph - Graph Seed Script
Generates a realistic multi-thousand node supply-chain network and ingests it
into Neo4j using batched UNWIND Cypher queries.

Usage:
    python scripts/seed_graph.py [--clean] [--suppliers 1200] [--manufacturers 600]
"""

import argparse
import os
import sys
import time

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import db
from app.services.neo4j_service import neo4j_service
from app.utils.seed_data import generate_supply_chain_graph, save_graph_to_disk


def parse_args():
    parser = argparse.ArgumentParser(description="Seed Neo4j with AtmoGraph Supply Chain dataset")
    parser.add_argument("--clean", action="store_true", help="Wipe existing graph before seeding")
    parser.add_argument("--suppliers", type=int, default=1200, help="Number of suppliers to generate")
    parser.add_argument("--manufacturers", type=int, default=600, help="Number of manufacturers to generate")
    parser.add_argument("--ports", type=int, default=40, help="Number of ports to generate")
    parser.add_argument("--warehouses", type=int, default=250, help="Number of warehouses to generate")
    parser.add_argument("--distributors", type=int, default=250, help="Number of distributors to generate")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 65)
    print("  AtmoGraph: Global Supply Chain Graph Seeder")
    print("=" * 65)
    print(f"Target Neo4j: {settings.NEO4J_URI} (DB: {settings.NEO4J_DATABASE})")
    print(f"Node Targets: Suppliers={args.suppliers}, Manufacturers={args.manufacturers},")
    print(f"              Ports={args.ports}, Warehouses={args.warehouses}, Distributors={args.distributors}")
    print("-" * 65)

    start_time = time.time()

    try:
        db.connect()
        if not db.is_connected():
            print(f"\n[ERROR] Unable to connect to Neo4j at {settings.NEO4J_URI}.")
            print("Please ensure Neo4j is running before seeding.")
            sys.exit(1)

        # 1. Initialize constraints and indexes
        print("\n[Step 1/4] Ensuring database constraints and indexes...")
        neo4j_service.create_constraints_and_indexes()

        # 2. Clean graph if requested
        if args.clean:
            print("\n[Step 2/4] Wiping existing graph data (--clean flag passed)...")
            db.execute_write("MATCH (n) DETACH DELETE n")
            print("  -> Existing graph wiped clean.")
        else:
            print("\n[Step 2/4] Using MERGE insertion (non-destructive)...")

        # 3. Generate Graph Data
        print("\n[Step 3/4] Generating realistic synthetic supply chain graph data...")
        gen_start = time.time()
        nodes, edges = generate_supply_chain_graph(
            supplier_count=args.suppliers,
            manufacturer_count=args.manufacturers,
            port_count=args.ports,
            warehouse_count=args.warehouses,
            distributor_count=args.distributors,
        )
        save_graph_to_disk(nodes, edges)
        print(f"  -> Generated {len(nodes):,} nodes and {len(edges):,} relationships in {time.time() - gen_start:.2f}s.")

        # 4. Ingest Nodes into Neo4j in Batches
        print("\n[Step 4/4] Ingesting nodes and relationships into Neo4j via batched UNWIND...")
        ingest_start = time.time()

        # Group nodes by label for targeted ingestion
        nodes_by_label = {}
        for n in nodes:
            label = n.get("label") or "Supplier"
            nodes_by_label.setdefault(label, []).append(n)

        for label, label_nodes in nodes_by_label.items():
            t0 = time.time()
            count = neo4j_service.batch_insert_nodes(label, label_nodes, batch_size=500)
            print(f"  + Loaded {count:,} {label} nodes ({time.time() - t0:.2f}s)")

        # Group edges by type for targeted ingestion
        edges_by_type = {}
        for e in edges:
            rel_type = e.get("type") or "SUPPLIES"
            edges_by_type.setdefault(rel_type, []).append(e)

        for rel_type, type_edges in edges_by_type.items():
            t0 = time.time()
            count = neo4j_service.batch_insert_edges(rel_type, type_edges, batch_size=500)
            print(f"  + Loaded {count:,} {rel_type} edges ({time.time() - t0:.2f}s)")

        # Verify final database counts
        node_count_res = db.execute_read("MATCH (n) RETURN count(n) AS c")
        edge_count_res = db.execute_read("MATCH ()-[r]->() RETURN count(r) AS c")
        final_nodes = node_count_res[0]["c"] if node_count_res else len(nodes)
        final_edges = edge_count_res[0]["c"] if edge_count_res else len(edges)

        total_duration = time.time() - start_time
        print("\n" + "=" * 65)
        print("  SEEDING COMPLETE SUCCESSFULLY!")
        print("=" * 65)
        print(f"Total Nodes in Neo4j:         {final_nodes:,}")
        print(f"Total Relationships in Neo4j: {final_edges:,}")
        print(f"Ingestion Duration:           {time.time() - ingest_start:.2f}s")
        print(f"Total Elapsed Time:           {total_duration:.2f}s")
        print("=" * 65)

    except Exception as e:
        print(f"\n[ERROR] Seeding failed with error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
