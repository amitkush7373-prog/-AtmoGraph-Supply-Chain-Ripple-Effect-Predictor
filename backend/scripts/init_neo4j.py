#!/usr/bin/env python3
"""
AtmoGraph - Neo4j Schema Initializer
Creates constraints and performance indexes on node labels in Neo4j.

Usage:
    python scripts/init_neo4j.py
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import db
from app.services.neo4j_service import neo4j_service


def main():
    print("=" * 60)
    print("  AtmoGraph: Initializing Neo4j Schema & Constraints")
    print("=" * 60)
    print(f"Target Database URI: {settings.NEO4J_URI}")
    print(f"Username:            {settings.NEO4J_USERNAME}")
    print(f"Database:            {settings.NEO4J_DATABASE}")
    print("-" * 60)

    try:
        driver = db.connect()
        if not db.is_connected():
            print(f"\n[ERROR] Could not connect to Neo4j at {settings.NEO4J_URI}.")
            print("Please ensure your Neo4j container or server is running:")
            print("  docker-compose up -d neo4j")
            sys.exit(1)

        print("[INFO] Successfully connected to Neo4j. Applying schema constraints and indexes...")
        results = neo4j_service.create_constraints_and_indexes()

        print(f"[SUCCESS] Created/Verified {len(results['constraints'])} constraints:")
        for c in results["constraints"]:
            print(f"  + {c}")

        print(f"\n[SUCCESS] Created/Verified {len(results['indexes'])} indexes:")
        for idx in results["indexes"]:
            print(f"  + {idx}")

        print("\n[COMPLETE] Neo4j schema is fully initialized and optimized for querying.")
    except Exception as e:
        print(f"\n[ERROR] Schema initialization failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
