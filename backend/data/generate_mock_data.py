"""
AtmoGraph - Mock Supply Chain Dataset Generator
Generates a synthetic global supply chain graph:
  1500 nodes total -> Suppliers(800), Manufacturers(400), Ports(150), Distributors(150)
Edges: SUPPLIES_TO, SHIPS_VIA, ROUTES_TO with lead_time_days + risk_score

Run:
    python generate_mock_data.py

Outputs:
    nodes.json
    edges.json
"""

import json
import random
from pathlib import Path

random.seed(42)

OUT_DIR = Path(__file__).parent

INDUSTRIES = [
    "Electronics", "Automotive", "Textiles", "Pharmaceuticals",
    "Consumer Goods", "Semiconductors", "Food & Beverage", "Chemicals"
]

CITIES = [
    ("Shenzhen", "China"), ("Shanghai", "China"), ("Mumbai", "India"),
    ("Chennai", "India"), ("Ho Chi Minh City", "Vietnam"), ("Hanoi", "Vietnam"),
    ("Jakarta", "Indonesia"), ("Bangkok", "Thailand"), ("Seoul", "South Korea"),
    ("Busan", "South Korea"), ("Taipei", "Taiwan"), ("Osaka", "Japan"),
    ("Tokyo", "Japan"), ("Rotterdam", "Netherlands"), ("Hamburg", "Germany"),
    ("Los Angeles", "USA"), ("Long Beach", "USA"), ("New York", "USA"),
    ("Chicago", "USA"), ("Sao Paulo", "Brazil"), ("Mexico City", "Mexico"),
    ("Istanbul", "Turkey"), ("Dubai", "UAE"), ("Singapore", "Singapore"),
    ("Manila", "Philippines"), ("Karachi", "Pakistan"), ("Dhaka", "Bangladesh"),
    ("Cairo", "Egypt"), ("Lagos", "Nigeria"), ("Johannesburg", "South Africa"),
]

SUPPLIER_PREFIXES = [
    "Global", "Pacific", "Atlas", "Summit", "Horizon", "Vertex", "Prime",
    "Nova", "Zenith", "Alpine", "Meridian", "Orion", "Titan", "Apex", "Delta"
]
SUPPLIER_SUFFIXES = [
    "Components", "Materials", "Fabrics", "Metals", "Polymers", "Electronics",
    "Trading Co.", "Industries", "Sourcing", "Resources", "Textiles", "Chem Corp"
]

MANUFACTURER_SUFFIXES = [
    "Manufacturing", "Assembly Works", "Factory", "Industries", "Production Group",
    "Fabrication Co.", "Engineering Works", "Motors", "Electronics Plant"
]

PORT_NAMES = [
    "Port of {city}", "{city} Container Terminal", "{city} Harbor",
    "{city} Freight Terminal"
]

DISTRIBUTOR_SUFFIXES = [
    "Logistics", "Distribution Center", "Warehouse Hub", "Freight Solutions",
    "Supply Co.", "Fulfillment Center"
]


def risk_tag(score: float) -> str:
    if score < 0.25:
        return "low"
    if score < 0.5:
        return "moderate"
    if score < 0.75:
        return "elevated"
    return "high"


def make_name(pool_prefix, pool_suffix, idx):
    return f"{random.choice(pool_prefix)} {random.choice(pool_suffix)} #{idx}"


def generate_nodes():
    nodes = []
    node_id = 0

    def new_id(prefix):
        nonlocal node_id
        node_id += 1
        return f"{prefix}_{node_id}"

    suppliers, manufacturers, ports, distributors = [], [], [], []

    for i in range(1, 801):
        city, country = random.choice(CITIES)
        risk = round(random.uniform(0, 1), 3)
        node = {
            "id": new_id("SUP"),
            "label": "Supplier",
            "name": make_name(SUPPLIER_PREFIXES, SUPPLIER_SUFFIXES, i),
            "industry": random.choice(INDUSTRIES),
            "city": city,
            "country": country,
            "risk_score": risk,
            "risk_tag": risk_tag(risk),
        }
        suppliers.append(node)
        nodes.append(node)

    for i in range(1, 401):
        city, country = random.choice(CITIES)
        risk = round(random.uniform(0, 1), 3)
        node = {
            "id": new_id("MAN"),
            "label": "Manufacturer",
            "name": make_name(SUPPLIER_PREFIXES, MANUFACTURER_SUFFIXES, i),
            "industry": random.choice(INDUSTRIES),
            "city": city,
            "country": country,
            "risk_score": risk,
            "risk_tag": risk_tag(risk),
        }
        manufacturers.append(node)
        nodes.append(node)

    for i in range(1, 151):
        city, country = random.choice(CITIES)
        risk = round(random.uniform(0, 1), 3)
        node = {
            "id": new_id("PRT"),
            "label": "Port",
            "name": random.choice(PORT_NAMES).format(city=city),
            "city": city,
            "country": country,
            "risk_score": risk,
            "risk_tag": risk_tag(risk),
        }
        ports.append(node)
        nodes.append(node)

    for i in range(1, 151):
        city, country = random.choice(CITIES)
        risk = round(random.uniform(0, 1), 3)
        node = {
            "id": new_id("DIS"),
            "label": "Distributor",
            "name": make_name(SUPPLIER_PREFIXES, DISTRIBUTOR_SUFFIXES, i),
            "city": city,
            "country": country,
            "risk_score": risk,
            "risk_tag": risk_tag(risk),
        }
        distributors.append(node)
        nodes.append(node)

    return nodes, suppliers, manufacturers, ports, distributors


def generate_edges(suppliers, manufacturers, ports, distributors):
    edges = []
    edge_id = 0

    def new_edge_id():
        nonlocal edge_id
        edge_id += 1
        return f"E{edge_id}"

    def add_edge(source, target, rel_type):
        edges.append({
            "id": new_edge_id(),
            "source": source["id"],
            "target": target["id"],
            "type": rel_type,
            "lead_time_days": random.randint(2, 60),
            "risk_score": round(random.uniform(0, 1), 3),
        })

    for s in suppliers:
        for m in random.sample(manufacturers, k=random.randint(2, 5)):
            add_edge(s, m, "SUPPLIES_TO")

    for m in manufacturers:
        for p in random.sample(ports, k=random.randint(2, 4)):
            add_edge(m, p, "SHIPS_VIA")

    for p in ports:
        for d in random.sample(distributors, k=random.randint(2, 5)):
            add_edge(p, d, "ROUTES_TO")

    return edges


def main():
    nodes, suppliers, manufacturers, ports, distributors = generate_nodes()
    edges = generate_edges(suppliers, manufacturers, ports, distributors)

    (OUT_DIR / "nodes.json").write_text(json.dumps(nodes, indent=2))
    (OUT_DIR / "edges.json").write_text(json.dumps(edges, indent=2))

    print(f"Generated {len(nodes)} nodes:")
    print(f"  Suppliers:     {len(suppliers)}")
    print(f"  Manufacturers: {len(manufacturers)}")
    print(f"  Ports:         {len(ports)}")
    print(f"  Distributors:  {len(distributors)}")
    print(f"Generated {len(edges)} edges")
    print(f"Files written to: {OUT_DIR}/nodes.json, {OUT_DIR}/edges.json")


if __name__ == "__main__":
    main()