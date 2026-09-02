import json
import logging
import random
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger("atmograph.seed_data")

# Real-world locations with lat/lng
GLOBAL_LOCATIONS = [
    # Europe
    {"city": "Rotterdam", "country": "Netherlands", "region": "Europe", "lat": 51.9244, "lng": 4.4777},
    {"city": "Hamburg", "country": "Germany", "region": "Europe", "lat": 53.5511, "lng": 9.9937},
    {"city": "Antwerp", "country": "Belgium", "region": "Europe", "lat": 51.2194, "lng": 4.4025},
    {"city": "Bremerhaven", "country": "Germany", "region": "Europe", "lat": 53.5396, "lng": 8.5809},
    {"city": "Valencia", "country": "Spain", "region": "Europe", "lat": 39.4699, "lng": -0.3763},
    {"city": "Felixstowe", "country": "United Kingdom", "region": "Europe", "lat": 51.9639, "lng": 1.3511},
    {"city": "Stuttgart", "country": "Germany", "region": "Europe", "lat": 48.7758, "lng": 9.1829},
    {"city": "Munich", "country": "Germany", "region": "Europe", "lat": 48.1351, "lng": 11.5820},
    {"city": "Eindhoven", "country": "Netherlands", "region": "Europe", "lat": 51.4416, "lng": 5.4697},
    {"city": "Dresden", "country": "Germany", "region": "Europe", "lat": 51.0504, "lng": 13.7373},
    {"city": "Milan", "country": "Italy", "region": "Europe", "lat": 45.4642, "lng": 9.1900},
    {"city": "Lyon", "country": "France", "region": "Europe", "lat": 45.7640, "lng": 4.8357},
    {"city": "Gothenburg", "country": "Sweden", "region": "Europe", "lat": 57.7089, "lng": 11.9746},

    # Asia-Pacific
    {"city": "Shanghai", "country": "China", "region": "Asia-Pacific", "lat": 31.2304, "lng": 121.4737},
    {"city": "Shenzhen", "country": "China", "region": "Asia-Pacific", "lat": 22.5431, "lng": 114.0579},
    {"city": "Ningbo-Zhoushan", "country": "China", "region": "Asia-Pacific", "lat": 29.8683, "lng": 121.5440},
    {"city": "Guangzhou", "country": "China", "region": "Asia-Pacific", "lat": 23.1291, "lng": 113.2644},
    {"city": "Singapore", "country": "Singapore", "region": "Asia-Pacific", "lat": 1.3521, "lng": 103.8198},
    {"city": "Busan", "country": "South Korea", "region": "Asia-Pacific", "lat": 35.1796, "lng": 129.0756},
    {"city": "Seoul", "country": "South Korea", "region": "Asia-Pacific", "lat": 37.5665, "lng": 126.9780},
    {"city": "Tokyo", "country": "Japan", "region": "Asia-Pacific", "lat": 35.6762, "lng": 139.6503},
    {"city": "Yokohama", "country": "Japan", "region": "Asia-Pacific", "lat": 35.4437, "lng": 139.6380},
    {"city": "Osaka", "country": "Japan", "region": "Asia-Pacific", "lat": 34.6937, "lng": 135.5023},
    {"city": "Taipei", "country": "Taiwan", "region": "Asia-Pacific", "lat": 25.0330, "lng": 121.5654},
    {"city": "Hsinchu", "country": "Taiwan", "region": "Asia-Pacific", "lat": 24.8138, "lng": 120.9675},
    {"city": "Kaohsiung", "country": "Taiwan", "region": "Asia-Pacific", "lat": 22.6273, "lng": 120.3014},
    {"city": "Tanjung Pelepas", "country": "Malaysia", "region": "Asia-Pacific", "lat": 1.3621, "lng": 103.5511},
    {"city": "Penang", "country": "Malaysia", "region": "Asia-Pacific", "lat": 5.4164, "lng": 100.3327},
    {"city": "Ho Chi Minh City", "country": "Vietnam", "region": "Asia-Pacific", "lat": 10.8231, "lng": 106.6297},
    {"city": "Hai Phong", "country": "Vietnam", "region": "Asia-Pacific", "lat": 20.8449, "lng": 106.6881},
    {"city": "Bangkok", "country": "Thailand", "region": "Asia-Pacific", "lat": 13.7563, "lng": 100.5018},
    {"city": "Laem Chabang", "country": "Thailand", "region": "Asia-Pacific", "lat": 13.0827, "lng": 100.8833},
    {"city": "Mumbai", "country": "India", "region": "Asia-Pacific", "lat": 19.0760, "lng": 72.8777},
    {"city": "Chennai", "country": "India", "region": "Asia-Pacific", "lat": 13.0827, "lng": 80.2707},
    {"city": "Bengaluru", "country": "India", "region": "Asia-Pacific", "lat": 12.9716, "lng": 77.5946},
    {"city": "Jakarta", "country": "Indonesia", "region": "Asia-Pacific", "lat": -6.2088, "lng": 106.8456},
    {"city": "Manila", "country": "Philippines", "region": "Asia-Pacific", "lat": 14.5995, "lng": 120.9842},

    # North America
    {"city": "Los Angeles", "country": "USA", "region": "North America", "lat": 34.0522, "lng": -118.2437},
    {"city": "Long Beach", "country": "USA", "region": "North America", "lat": 33.7701, "lng": -118.1937},
    {"city": "New York", "country": "USA", "region": "North America", "lat": 40.7128, "lng": -74.0060},
    {"city": "Houston", "country": "USA", "region": "North America", "lat": 29.7604, "lng": -95.3698},
    {"city": "Savannah", "country": "USA", "region": "North America", "lat": 32.0809, "lng": -81.0912},
    {"city": "Chicago", "country": "USA", "region": "North America", "lat": 41.8781, "lng": -87.6298},
    {"city": "Austin", "country": "USA", "region": "North America", "lat": 30.2672, "lng": -97.7431},
    {"city": "Seattle", "country": "USA", "region": "North America", "lat": 47.6062, "lng": -122.3321},
    {"city": "Vancouver", "country": "Canada", "region": "North America", "lat": 49.2827, "lng": -123.1207},
    {"city": "Monterrey", "country": "Mexico", "region": "North America", "lat": 25.6866, "lng": -100.3161},
    {"city": "Guadalajara", "country": "Mexico", "region": "North America", "lat": 20.6597, "lng": -103.3496},

    # Middle East & Latin America & Africa
    {"city": "Dubai", "country": "UAE", "region": "Middle East", "lat": 25.2048, "lng": 55.2708},
    {"city": "Jebel Ali", "country": "UAE", "region": "Middle East", "lat": 24.9857, "lng": 55.0273},
    {"city": "Port Said", "country": "Egypt", "region": "Middle East", "lat": 31.2653, "lng": 32.3019},
    {"city": "Santos", "country": "Brazil", "region": "Latin America", "lat": -23.9618, "lng": -46.3322},
    {"city": "Sao Paulo", "country": "Brazil", "region": "Latin America", "lat": -23.5505, "lng": -46.6333},
    {"city": "Durban", "country": "South Africa", "region": "Africa", "lat": -29.8587, "lng": 31.0218},
]

INDUSTRIES = [
    "Semiconductors", "Electronics", "Automotive", "Pharmaceuticals",
    "Consumer Goods", "Energy & Chemicals", "Aerospace", "Food & Beverage", "Industrial Machinery"
]

PRODUCTS_CATALOG = [
    {"name": "Automotive 32-bit Microcontrollers", "industry": "Semiconductors"},
    {"name": "AI Tensor Processing Accelerators", "industry": "Semiconductors"},
    {"name": "Silicon Carbide Power Inverters", "industry": "Electronics"},
    {"name": "High-Density Lithium-Ion Battery Packs", "industry": "Automotive"},
    {"name": "Autonomous Vision Sensor Modules", "industry": "Automotive"},
    {"name": "Sterile mRNA Vaccine Vials", "industry": "Pharmaceuticals"},
    {"name": "Biologics Active Pharmaceutical Ingredients", "industry": "Pharmaceuticals"},
    {"name": "Next-Gen OLED Display Panels", "industry": "Electronics"},
    {"name": "Industrial Robotic Servo Actuators", "industry": "Industrial Machinery"},
    {"name": "Precision Titanium Aerospace Fasteners", "industry": "Aerospace"},
    {"name": "Multi-Layer Ceramic Capacitors (MLCC)", "industry": "Electronics"},
    {"name": "High-Purity Silicon Wafers 300mm", "industry": "Semiconductors"},
    {"name": "Ultra-High Purity Electronic Chemicals", "industry": "Energy & Chemicals"},
    {"name": "Automotive Electric Traction Motors", "industry": "Automotive"},
    {"name": "Smart Connected Infotainment Units", "industry": "Consumer Goods"},
    {"name": "Cold-Chain Temperature Sensitive Injectables", "industry": "Pharmaceuticals"},
    {"name": "Photovoltaic Solar Inverter Units", "industry": "Energy & Chemicals"},
    {"name": "Industrial Automation PLC Controllers", "industry": "Industrial Machinery"},
    {"name": "Precision CNC Micro-Gearboxes", "industry": "Industrial Machinery"},
    {"name": "Commercial Carbon-Fiber Winglets", "industry": "Aerospace"},
]

SUPPLIER_PREFIXES = [
    "Apex", "Atlas", "Summit", "Vertex", "Nova", "Zenith", "Meridian", "Titan", "Delta", "Orion",
    "Pacific", "Alpine", "Horizon", "Quantum", "Nexus", "Pinnacle", "Vanguard", "Genesis", "Aero",
    "Precision", "Global", "Micro", "Advanced", "Optima", "Terra", "Starlight", "Hyperion", "Synapse"
]

SUPPLIER_SUFFIXES = [
    "Semiconductor Materials", "Microelectronics", "Precision Tech", "Chemical Solutions",
    "Silicon Systems", "Polymers & Alloys", "Foundry Supply", "Electro-Optics", "Sensor Components",
    "Advanced Materials", "BioTech Synthetics", "Rare Earths", "Precision Castings", "Circuit Tech",
    "Battery Materials", "Power Modules", "Nanotech Sourcing", "Fiber Optic Supply"
]

MANUFACTURER_SUFFIXES = [
    "Fabrication Works", "Assembly Giga-Plant", "Semiconductor Fab", "Advanced Manufacturing",
    "Production Complex", "Engineering Systems", "Robotics Facility", "Electronics Integration",
    "Power Systems Plant", "Pharma Synthesis Lab", "Precision Automation Works", "Industrial Group"
]

WAREHOUSE_NAMES = [
    "MegaHub Fulfillment Center", "Central Transshipment Depot", "Automated Logistics Hub",
    "Cold-Chain High-Capacity Depot", "Cross-Docking Terminal", " bonded Regional Warehouse",
    "Integrated Freight Center", "Supply Chain Gateway Depot"
]

DISTRIBUTOR_NAMES = [
    "Global Freight Direct", "Trans-Ocean Logistics Group", "Pan-Continental Cargo Services",
    "FastTrack Intermodal Distribution", "Nexus Worldwide Logistics", "Precision Express Supply",
    "Alliance Cargo Networks", "Strategic Distribution Link"
]


def _risk_level_from_score(score: float) -> str:
    if score >= 0.85:
        return "CRITICAL"
    elif score >= 0.60:
        return "HIGH"
    elif score >= 0.30:
        return "MEDIUM"
    return "LOW"


def generate_supply_chain_graph(
    supplier_count: int = 1200,
    manufacturer_count: int = 600,
    port_count: int = 40,
    warehouse_count: int = 250,
    distributor_count: int = 250,
    seed: int = 42,
) -> Tuple[List[Dict], List[Dict]]:
    """
    Generates a realistic multi-tier global supply chain network graph with
    thousands of interconnected nodes.
    """
    random.seed(seed)
    nodes = []
    edges = []
    node_id_counter = 0
    edge_id_counter = 0

    def next_node_id(prefix: str) -> str:
        nonlocal node_id_counter
        node_id_counter += 1
        return f"{prefix}_{node_id_counter:05d}"

    def next_edge_id() -> str:
        nonlocal edge_id_counter
        edge_id_counter += 1
        return f"REL_{edge_id_counter:06d}"

    # 1. Generate Products
    products = []
    for idx, p in enumerate(PRODUCTS_CATALOG, 1):
        pid = f"PRD_{idx:04d}"
        score = round(random.uniform(0.05, 0.25), 3)
        product_node = {
            "id": pid,
            "label": "Product",
            "type": "Product",
            "name": p["name"],
            "industry": p["industry"],
            "country": "Global",
            "city": "Global",
            "region": "Global",
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Baseline operational supply availability",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": 0.0,
            "longitude": 0.0,
        }
        products.append(product_node)
        nodes.append(product_node)

    # 2. Generate Real-World Maritime & Cargo Ports
    ports = []
    for i, loc in enumerate(GLOBAL_LOCATIONS[:port_count]):
        score = round(random.uniform(0.05, 0.28), 3)
        port_node = {
            "id": f"PRT_{i+1:04d}",
            "label": "Port",
            "type": "Port",
            "name": f"Port of {loc['city']}",
            "city": loc["city"],
            "country": loc["country"],
            "region": loc["region"],
            "industry": "Maritime & Freight Logistics",
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Standard port operations and berth productivity",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": loc["lat"],
            "longitude": loc["lng"],
        }
        ports.append(port_node)
        nodes.append(port_node)

    # 3. Generate Suppliers (Tier 1 & Tier 2)
    suppliers = []
    for i in range(supplier_count):
        loc = random.choice(GLOBAL_LOCATIONS)
        industry = random.choice(INDUSTRIES)
        name = f"{random.choice(SUPPLIER_PREFIXES)} {random.choice(SUPPLIER_SUFFIXES)} #{i+1}"
        score = round(random.uniform(0.04, 0.35), 3)
        sup_node = {
            "id": next_node_id("SUP"),
            "label": "Supplier",
            "type": "Supplier",
            "name": name,
            "city": loc["city"],
            "country": loc["country"],
            "region": loc["region"],
            "industry": industry,
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Normal procurement and supplier inventory level",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": loc["lat"] + random.uniform(-0.15, 0.15),
            "longitude": loc["lng"] + random.uniform(-0.15, 0.15),
        }
        suppliers.append(sup_node)
        nodes.append(sup_node)

    # 4. Generate Manufacturers
    manufacturers = []
    for i in range(manufacturer_count):
        loc = random.choice(GLOBAL_LOCATIONS)
        industry = random.choice(INDUSTRIES)
        name = f"{random.choice(SUPPLIER_PREFIXES)} {random.choice(MANUFACTURER_SUFFIXES)} #{i+1}"
        score = round(random.uniform(0.05, 0.32), 3)
        man_node = {
            "id": next_node_id("MAN"),
            "label": "Manufacturer",
            "type": "Manufacturer",
            "name": name,
            "city": loc["city"],
            "country": loc["country"],
            "region": loc["region"],
            "industry": industry,
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Standard plant utilization and production schedule",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": loc["lat"] + random.uniform(-0.12, 0.12),
            "longitude": loc["lng"] + random.uniform(-0.12, 0.12),
        }
        manufacturers.append(man_node)
        nodes.append(man_node)

    # 5. Generate Warehouses
    warehouses = []
    for i in range(warehouse_count):
        loc = random.choice(GLOBAL_LOCATIONS)
        name = f"{loc['city']} {random.choice(WAREHOUSE_NAMES)} #{i+1}"
        score = round(random.uniform(0.05, 0.25), 3)
        wh_node = {
            "id": next_node_id("WRH"),
            "label": "Warehouse",
            "type": "Warehouse",
            "name": name,
            "city": loc["city"],
            "country": loc["country"],
            "region": loc["region"],
            "industry": "Storage & Logistics",
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Optimal storage capacity and throughput",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": loc["lat"] + random.uniform(-0.1, 0.1),
            "longitude": loc["lng"] + random.uniform(-0.1, 0.1),
        }
        warehouses.append(wh_node)
        nodes.append(wh_node)

    # 6. Generate Distributors
    distributors = []
    for i in range(distributor_count):
        loc = random.choice(GLOBAL_LOCATIONS)
        name = f"{random.choice(SUPPLIER_PREFIXES)} {random.choice(DISTRIBUTOR_NAMES)} #{i+1}"
        score = round(random.uniform(0.05, 0.28), 3)
        dst_node = {
            "id": next_node_id("DST"),
            "label": "Distributor",
            "type": "Distributor",
            "name": name,
            "city": loc["city"],
            "country": loc["country"],
            "region": loc["region"],
            "industry": "Distribution Logistics",
            "risk": _risk_level_from_score(score),
            "risk_score": score,
            "status": "OPERATIONAL",
            "risk_reason": "Active order delivery pipelines operating on time",
            "updated_at": "2026-09-01T00:00:00Z",
            "latitude": loc["lat"] + random.uniform(-0.1, 0.1),
            "longitude": loc["lng"] + random.uniform(-0.1, 0.1),
        }
        distributors.append(dst_node)
        nodes.append(dst_node)

    # Helper to add edge
    def add_edge(src_id: str, tgt_id: str, rel_type: str, lead_time: int, risk: float, status: str = "NORMAL"):
        edges.append({
            "id": next_edge_id(),
            "source": src_id,
            "target": tgt_id,
            "type": rel_type,
            "relationship": rel_type,
            "lead_time_days": lead_time,
            "risk_score": round(risk, 3),
            "status": status,
        })

    # 7. Create Interconnections
    # 7.1 Suppliers -> Manufacturers (SUPPLIES)
    for sup in suppliers:
        # Connect to 2 - 4 manufacturers with same or complementary industry if possible
        matched_mans = [m for m in manufacturers if m["industry"] == sup["industry"]]
        if not matched_mans or len(matched_mans) < 3:
            matched_mans = manufacturers
        targets = random.sample(matched_mans, k=min(len(matched_mans), random.randint(2, 4)))
        for target_man in targets:
            lead = random.randint(3, 25)
            r_score = round(random.uniform(0.05, 0.25), 3)
            add_edge(sup["id"], target_man["id"], "SUPPLIES", lead, r_score)

    # 7.2 Manufacturers -> Products (MANUFACTURES)
    for man in manufacturers:
        matched_prods = [p for p in products if p["industry"] == man["industry"]]
        if not matched_prods:
            matched_prods = products
        prod = random.choice(matched_prods)
        add_edge(man["id"], prod["id"], "MANUFACTURES", random.randint(1, 14), 0.1)

    # 7.3 Manufacturers -> Ports (SHIPS_TO)
    for man in manufacturers:
        # Connect to 1 - 3 ports in the same region or nearest
        regional_ports = [p for p in ports if p["region"] == man["region"]]
        if not regional_ports:
            regional_ports = ports
        targets = random.sample(regional_ports, k=min(len(regional_ports), random.randint(1, 3)))
        for p in targets:
            lead = random.randint(2, 10)
            r_score = round(random.uniform(0.05, 0.20), 3)
            add_edge(man["id"], p["id"], "SHIPS_TO", lead, r_score)

    # 7.4 Ports -> Ports (Intercontinental Maritime Routes SHIPS_TO)
    for port in ports:
        other_ports = [p for p in ports if p["id"] != port["id"]]
        targets = random.sample(other_ports, k=random.randint(2, 5))
        for tgt_port in targets:
            lead = random.randint(10, 45)
            r_score = round(random.uniform(0.08, 0.30), 3)
            add_edge(port["id"], tgt_port["id"], "SHIPS_TO", lead, r_score)

    # 7.5 Ports -> Warehouses (SHIPS_TO)
    for wh in warehouses:
        regional_ports = [p for p in ports if p["region"] == wh["region"]]
        if not regional_ports:
            regional_ports = ports
        port = random.choice(regional_ports)
        add_edge(port["id"], wh["id"], "SHIPS_TO", random.randint(2, 8), 0.1)

    # 7.6 Warehouses -> Products (STORES)
    for wh in warehouses:
        prods = random.sample(products, k=random.randint(2, 5))
        for prd in prods:
            add_edge(wh["id"], prd["id"], "STORES", 0, 0.05)

    # 7.7 Warehouses -> Distributors (DISTRIBUTES_TO)
    for wh in warehouses:
        regional_dist = [d for d in distributors if d["region"] == wh["region"]]
        if not regional_dist:
            regional_dist = distributors
        targets = random.sample(regional_dist, k=min(len(regional_dist), random.randint(2, 4)))
        for dst in targets:
            lead = random.randint(1, 6)
            add_edge(wh["id"], dst["id"], "DISTRIBUTES_TO", lead, 0.08)

    # 7.8 Distributors -> Products (PRODUCES / DISTRIBUTES_TO)
    for dst in distributors:
        prods = random.sample(products, k=random.randint(1, 3))
        for prd in prods:
            add_edge(dst["id"], prd["id"], "DISTRIBUTES_TO", random.randint(1, 4), 0.05)

    logger.info(f"Generated {len(nodes)} nodes and {len(edges)} edges for AtmoGraph.")
    return nodes, edges


def save_graph_to_disk(nodes: List[Dict], edges: List[Dict], target_dir: Path = None) -> Tuple[Path, Path]:
    if target_dir is None:
        target_dir = Path(__file__).parent.parent.parent / "data"
    target_dir.mkdir(parents=True, exist_ok=True)

    nodes_file = target_dir / "nodes.json"
    edges_file = target_dir / "edges.json"

    with open(nodes_file, "w", encoding="utf-8") as f:
        json.dump(nodes, f, indent=2)

    with open(edges_file, "w", encoding="utf-8") as f:
        json.dump(edges, f, indent=2)

    logger.info(f"Saved {len(nodes)} nodes to {nodes_file} and {len(edges)} edges to {edges_file}")
    return nodes_file, edges_file


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    nodes, edges = generate_supply_chain_graph()
    save_graph_to_disk(nodes, edges)
    print(f"Generated {len(nodes)} nodes and {len(edges)} edges successfully.")
