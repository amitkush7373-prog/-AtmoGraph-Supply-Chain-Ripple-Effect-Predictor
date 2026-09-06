import datetime
import json
import logging
import math
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW

from app.services.gnn_architecture import SupplyChainGNN

logger = logging.getLogger("atmograph.gnn_training")

MODEL_DIR = Path(__file__).parent.parent / "models"
DATA_DIR = Path(__file__).parent.parent.parent / "data"
MODEL_WEIGHTS_PATH = MODEL_DIR / "gnn_delay_model.pt"
METRICS_PATH = MODEL_DIR / "gnn_metrics.json"

NODE_TYPE_MAP = {
    "Supplier": 0,
    "raw": 0,
    "Manufacturer": 1,
    "manufacturer": 1,
    "component": 1,
    "Port": 2,
    "port": 2,
    "Warehouse": 3,
    "warehouse": 3,
    "Distributor": 4,
    "retailer": 4,
    "Product": 5,
    "consumer": 5,
}


# Presentation 21-node network topology matching GlobalSupplyGraph
CORE_SUPPLY_NODES = [
    {"id": "RAW_LITHIUM", "name": "Lithium (Australia)", "category": "raw", "lead_time_days": 18, "risk_score": 0.12},
    {"id": "RAW_COBALT", "name": "Cobalt (Congo)", "category": "raw", "lead_time_days": 24, "risk_score": 0.18},
    {"id": "RAW_COPPER", "name": "Copper (Chile)", "category": "raw", "lead_time_days": 16, "risk_score": 0.10},
    {"id": "RAW_RARE_EARTH", "name": "Rare Earth Metals (China)", "category": "raw", "lead_time_days": 20, "risk_score": 0.15},
    {"id": "MAN_01453", "name": "Wafers (Taiwan)", "category": "component", "lead_time_days": 21, "risk_score": 0.22},
    {"id": "CMP_DISPLAY", "name": "Display Panels (Japan)", "category": "component", "lead_time_days": 14, "risk_score": 0.14},
    {"id": "CMP_BATTERY", "name": "Battery Cells (S. Korea)", "category": "component", "lead_time_days": 18, "risk_score": 0.16},
    {"id": "MAN_SHENZHEN", "name": "Electronics Assembly (Shenzhen)", "category": "manufacturer", "lead_time_days": 15, "risk_score": 0.20},
    {"id": "MAN_MEXICO", "name": "Appliance Mfg (Mexico)", "category": "manufacturer", "lead_time_days": 12, "risk_score": 0.15},
    {"id": "MAN_TEXAS", "name": "Device Assembly (Texas)", "category": "manufacturer", "lead_time_days": 10, "risk_score": 0.16},
    {"id": "MAN_STUTTGART", "name": "Auto Assembly (Stuttgart)", "category": "manufacturer", "lead_time_days": 14, "risk_score": 0.18},
    {"id": "PRT_0004", "name": "Port of Shanghai", "category": "port", "lead_time_days": 12, "risk_score": 0.25},
    {"id": "HUB_SUEZ", "name": "Suez Canal", "category": "port", "lead_time_days": 10, "risk_score": 0.28},
    {"id": "PRT_0001", "name": "Port of Rotterdam", "category": "port", "lead_time_days": 14, "risk_score": 0.24},
    {"id": "PRT_LA", "name": "Port of Los Angeles", "category": "port", "lead_time_days": 12, "risk_score": 0.22},
    {"id": "HUB_PANAMA", "name": "Panama Canal", "category": "port", "lead_time_days": 8, "risk_score": 0.19},
    {"id": "WH_EU", "name": "EU Distribution Center", "category": "warehouse", "lead_time_days": 7, "risk_score": 0.14},
    {"id": "WH_US", "name": "US Distribution Center", "category": "warehouse", "lead_time_days": 7, "risk_score": 0.13},
    {"id": "RET_GLOBAL", "name": "Global Retail Network", "category": "retailer", "lead_time_days": 5, "risk_score": 0.11},
    {"id": "CONS_EU", "name": "European Consumers", "category": "consumer", "lead_time_days": 3, "risk_score": 0.08},
    {"id": "CONS_US", "name": "N. American Consumers", "category": "consumer", "lead_time_days": 3, "risk_score": 0.08},
]

CORE_SUPPLY_EDGES = [
    {"source": "RAW_LITHIUM", "target": "CMP_BATTERY", "lead_time_days": 18},
    {"source": "RAW_COBALT", "target": "CMP_BATTERY", "lead_time_days": 24},
    {"source": "RAW_COPPER", "target": "MAN_SHENZHEN", "lead_time_days": 16},
    {"source": "RAW_RARE_EARTH", "target": "MAN_01453", "lead_time_days": 20},
    {"source": "RAW_RARE_EARTH", "target": "MAN_SHENZHEN", "lead_time_days": 20},
    {"source": "CMP_DISPLAY", "target": "MAN_SHENZHEN", "lead_time_days": 14},
    {"source": "CMP_BATTERY", "target": "MAN_SHENZHEN", "lead_time_days": 18},
    {"source": "MAN_01453", "target": "PRT_0004", "lead_time_days": 8},
    {"source": "MAN_01453", "target": "MAN_TEXAS", "lead_time_days": 14},
    {"source": "MAN_SHENZHEN", "target": "PRT_0004", "lead_time_days": 6},
    {"source": "PRT_0004", "target": "HUB_SUEZ", "lead_time_days": 12},
    {"source": "HUB_SUEZ", "target": "PRT_0001", "lead_time_days": 8},
    {"source": "PRT_0004", "target": "PRT_LA", "lead_time_days": 14},
    {"source": "PRT_LA", "target": "WH_US", "lead_time_days": 5},
    {"source": "PRT_LA", "target": "MAN_TEXAS", "lead_time_days": 7},
    {"source": "MAN_MEXICO", "target": "HUB_PANAMA", "lead_time_days": 6},
    {"source": "HUB_PANAMA", "target": "MAN_TEXAS", "lead_time_days": 8},
    {"source": "MAN_TEXAS", "target": "WH_US", "lead_time_days": 4},
    {"source": "PRT_0001", "target": "MAN_STUTTGART", "lead_time_days": 6},
    {"source": "PRT_0001", "target": "WH_EU", "lead_time_days": 5},
    {"source": "MAN_STUTTGART", "target": "WH_EU", "lead_time_days": 4},
    {"source": "WH_EU", "target": "RET_GLOBAL", "lead_time_days": 4},
    {"source": "WH_EU", "target": "CONS_EU", "lead_time_days": 2},
    {"source": "WH_US", "target": "RET_GLOBAL", "lead_time_days": 4},
    {"source": "WH_US", "target": "CONS_US", "lead_time_days": 2},
    {"source": "RET_GLOBAL", "target": "CONS_EU", "lead_time_days": 2},
    {"source": "RET_GLOBAL", "target": "CONS_US", "lead_time_days": 2},
]


def load_raw_dataset() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    return CORE_SUPPLY_NODES, CORE_SUPPLY_EDGES


class SupplyChainGraphDataset:
    """
    Constructs normalized adjacency and generates feature tensors
    for training and evaluating SupplyChainGNN.
    """
    def __init__(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        self.nodes = nodes
        self.edges = edges
        self.N = len(nodes)
        self.node_id_to_idx = {n["id"]: idx for idx, n in enumerate(nodes)}
        self.idx_to_node_id = {idx: n["id"] for idx, n in enumerate(nodes)}

        # Build adjacency matrices
        self.in_neighbors: Dict[int, List[Tuple[int, float]]] = {i: [] for i in range(self.N)}
        self.out_neighbors: Dict[int, List[Tuple[int, float]]] = {i: [] for i in range(self.N)}

        adj = np.zeros((self.N, self.N), dtype=np.float32)
        for e in edges:
            src_id = e.get("source")
            tgt_id = e.get("target")
            if src_id in self.node_id_to_idx and tgt_id in self.node_id_to_idx:
                u = self.node_id_to_idx[src_id]
                v = self.node_id_to_idx[tgt_id]
                lead_time = float(e.get("lead_time_days", 14.0))
                # Weight transmission inversely with excessive lead time
                weight = 1.0 + min(2.0, lead_time / 14.0)
                adj[v, u] = weight  # Flow from u -> v
                self.in_neighbors[v].append((u, weight))
                self.out_neighbors[u].append((v, weight))

        # Row-normalize directed adjacency matrix: sum of inputs into v
        row_sums = adj.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        adj_norm = adj / row_sums

        # Add self-loops to preserve local node state
        np.fill_diagonal(adj_norm, 0.5)

        self.adj_norm_tensor = torch.tensor(adj_norm, dtype=torch.float32)

        # Precompute static node attributes
        self.in_degrees = np.array([len(self.in_neighbors[i]) for i in range(self.N)], dtype=np.float32)
        self.out_degrees = np.array([len(self.out_neighbors[i]) for i in range(self.N)], dtype=np.float32)
        self.base_risks = np.array([float(n.get("risk_score", 0.15)) for n in nodes], dtype=np.float32)

    def build_features(
        self,
        epicenter_indices: List[int],
        severity_score: float,
    ) -> torch.Tensor:
        """
        Builds [N, 16] node feature tensor for given disruption epicenters and severity.
        """
        feats = np.zeros((self.N, 16), dtype=np.float32)

        # Multi-source BFS to compute downstream topological hops
        hops = np.full(self.N, 999, dtype=np.int32)
        queue = []
        for epi in epicenter_indices:
            hops[epi] = 0
            queue.append(epi)

        head = 0
        while head < len(queue):
            curr = queue[head]
            head += 1
            curr_hop = hops[curr]
            if curr_hop < 4:  # Up to 4 ripple hops
                for (nxt, _) in self.out_neighbors[curr]:
                    if hops[nxt] > curr_hop + 1:
                        hops[nxt] = curr_hop + 1
                        queue.append(nxt)

        for i, n in enumerate(self.nodes):
            # 0-5: Node type one-hot (6 classes)
            ntype = n.get("type") or n.get("category", "Supplier")
            type_idx = NODE_TYPE_MAP.get(ntype, 0)
            if 0 <= type_idx < 6:
                feats[i, type_idx] = 1.0

            # 6-7: Normalized degrees
            feats[i, 6] = math.log1p(self.in_degrees[i]) / 4.0
            feats[i, 7] = math.log1p(self.out_degrees[i]) / 4.0

            # 8: Baseline risk
            feats[i, 8] = self.base_risks[i]

            # 9: Epicenter flag
            if i in epicenter_indices:
                feats[i, 9] = 1.0

            # 10: Severity
            if i in epicenter_indices:
                feats[i, 10] = severity_score
            elif hops[i] < 999:
                # Transmitted severity decays with distance
                feats[i, 10] = severity_score * (0.65 ** hops[i])

            # 11: Hop decay
            if hops[i] < 999:
                feats[i, 11] = 1.0 / (1.0 + float(hops[i]))

            # 12: Incoming disruption signal
            inc_signal = 0.0
            for (u, w) in self.in_neighbors[i]:
                if hops[u] < 999:
                    inc_signal += (severity_score * (0.75 ** hops[u])) * (w / 2.0)
            feats[i, 12] = min(3.0, inc_signal) / 3.0

            # 13: Average upstream lead time proxy
            feats[i, 13] = min(1.0, float(n.get("lead_time_days", 14.0)) / 30.0)

            # 14: Regional vulnerability
            feats[i, 14] = 0.8 if n.get("country") in ["Taiwan", "Netherlands", "China", "Germany", "USA"] else 0.5

            # 15: Critical bottleneck centrality
            feats[i, 15] = 1.0 if (self.in_degrees[i] >= 3 and self.out_degrees[i] >= 3) else 0.0

        return torch.tensor(feats, dtype=torch.float32)

    def simulate_ground_truth(
        self,
        epicenter_indices: List[int],
        severity_score: float,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Simulates realistic physical ground-truth downstream delays and risk scores.
        """
        delays = np.zeros(self.N, dtype=np.float32)
        risks = self.base_risks.copy()

        # Epicenter direct delay
        base_epicenter_delay = 18.0 * severity_score + random.uniform(-1.5, 1.5)
        for epi in epicenter_indices:
            delays[epi] = max(2.0, base_epicenter_delay)
            risks[epi] = min(1.0, risks[epi] + 0.35 + severity_score * 0.4)

        # Topological ripple cascade (damping factor gamma = 0.72)
        # Order nodes by distance from epicenters
        visited = set(epicenter_indices)
        current_layer = list(epicenter_indices)
        damping = 0.74

        for _ in range(4):  # Up to 4 hops
            next_layer = []
            for u in current_layer:
                u_delay = delays[u]
                for (v, w) in self.out_neighbors[u]:
                    # Delay propagated: function of upstream delay, edge weight, and buffer
                    added_delay = u_delay * damping * (w / 2.0) + random.uniform(-0.4, 0.4)
                    if added_delay > delays[v]:
                        delays[v] = max(0.0, added_delay)
                        risks[v] = min(1.0, risks[v] + (delays[v] / 24.0) * 0.5)
                    if v not in visited:
                        visited.add(v)
                        next_layer.append(v)
            current_layer = next_layer
            if not current_layer:
                break

        delays_tensor = torch.tensor(delays, dtype=torch.float32).unsqueeze(1)
        risks_tensor = torch.tensor(risks, dtype=torch.float32).unsqueeze(1)
        return delays_tensor, risks_tensor


def generate_synthetic_scenarios(dataset: SupplyChainGraphDataset, num_scenarios: int = 500):
    """
    Generates diverse disruption scenarios across ports, suppliers, and manufacturers.
    """
    scenarios = []

    # Find candidate epicenters (ports, major manufacturers, critical suppliers)
    port_indices = [i for i, n in enumerate(dataset.nodes) if n.get("type") in ["Port", "port"]]
    man_indices = [i for i, n in enumerate(dataset.nodes) if n.get("type") in ["Manufacturer", "manufacturer", "component"]]
    sup_indices = [i for i, n in enumerate(dataset.nodes) if n.get("type") in ["Supplier", "raw"]]

    all_candidates = port_indices + man_indices + sup_indices
    if not all_candidates:
        all_candidates = list(range(min(50, dataset.N)))

    severity_levels = [
        ("CRITICAL", 0.85),
        ("HIGH", 0.65),
        ("MEDIUM", 0.40),
        ("LOW", 0.20),
    ]

    for _ in range(num_scenarios):
        # 70% single epicenter, 30% dual compound epicenter
        num_epicenters = 1 if random.random() < 0.75 else 2
        epicenters = random.sample(all_candidates, min(num_epicenters, len(all_candidates)))
        _, severity_score = random.choice(severity_levels)

        # Add slight continuous noise to severity
        severity_score = float(np.clip(severity_score + random.uniform(-0.08, 0.08), 0.15, 0.95))

        x = dataset.build_features(epicenters, severity_score)
        y_delay, y_risk = dataset.simulate_ground_truth(epicenters, severity_score)
        scenarios.append((x, y_delay, y_risk))

    return scenarios


def train_gnn_model(
    epochs: int = 80,
    learning_rate: float = 0.005,
    hidden_dim: int = 64,
    num_scenarios: int = 450,
) -> Tuple[SupplyChainGNN, Dict[str, Any]]:
    """
    Trains SupplyChainGNN for node regression predicting downstream delays.
    """
    logger.info("Initializing Graph Dataset for GNN training...")
    nodes, edges = load_raw_dataset()
    dataset = SupplyChainGraphDataset(nodes, edges)

    logger.info(f"Loaded graph with {dataset.N} nodes and {len(edges)} relationships.")
    logger.info(f"Generating {num_scenarios} training disruption scenarios...")
    all_data = generate_synthetic_scenarios(dataset, num_scenarios=num_scenarios)

    # 75% train, 15% val, 10% test split
    random.seed(42)
    random.shuffle(all_data)
    n_train = int(len(all_data) * 0.75)
    n_val = int(len(all_data) * 0.15)

    train_data = all_data[:n_train]
    val_data = all_data[n_train:n_train + n_val]
    test_data = all_data[n_train + n_val:]

    # Stack into batched tensors for high-performance vectorized PyTorch training
    X_train = torch.stack([s[0] for s in train_data])
    Y_delay_train = torch.stack([s[1] for s in train_data])
    Y_risk_train = torch.stack([s[2] for s in train_data])

    X_val = torch.stack([s[0] for s in val_data])
    Y_delay_val = torch.stack([s[1] for s in val_data])
    Y_risk_val = torch.stack([s[2] for s in val_data])

    model = SupplyChainGNN(in_features=16, hidden_dim=hidden_dim, dropout=0.1)
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    loss_fn_delay = nn.SmoothL1Loss(beta=1.0)
    loss_fn_risk = nn.BCELoss()

    adj_norm = dataset.adj_norm_tensor

    best_val_mae = float("inf")
    best_weights = None
    batch_size = 16

    logger.info(f"Training SupplyChainGNN for {epochs} epochs (Batch size: {batch_size})...")

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        num_batches = 0

        # Shuffle batches each epoch
        perm = torch.randperm(X_train.size(0))
        for i in range(0, X_train.size(0), batch_size):
            indices = perm[i:i + batch_size]
            xb = X_train[indices]
            ydb = Y_delay_train[indices]
            yrb = Y_risk_train[indices]

            optimizer.zero_grad()
            pred_delay, pred_risk = model(xb, adj_norm)

            loss_d = loss_fn_delay(pred_delay, ydb)
            loss_r = loss_fn_risk(pred_risk, yrb)
            loss = loss_d + 0.4 * loss_r

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()

            train_loss += loss.item()
            num_batches += 1

        train_loss /= max(1, num_batches)

        # Vectorized Validation Step
        model.eval()
        with torch.no_grad():
            pred_delay_val, _ = model(X_val, adj_norm)
            val_mae = torch.mean(torch.abs(pred_delay_val - Y_delay_val)).item()

        if val_mae < best_val_mae:
            best_val_mae = val_mae
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 10 == 0 or epoch == 1:
            logger.info(f"Epoch {epoch:03d}/{epochs} | Train Loss: {train_loss:.4f} | Val MAE: {val_mae:.2f} days")

    # Load best weights
    if best_weights:
        model.load_state_dict(best_weights)

    # Test Evaluation
    model.eval()
    X_test = torch.stack([s[0] for s in test_data])
    Y_delay_test = torch.stack([s[1] for s in test_data])

    with torch.no_grad():
        pred_delay_test, _ = model(X_test, adj_norm)

    y_true_flat = Y_delay_test.numpy().flatten()
    y_pred_flat = pred_delay_test.numpy().flatten()

    mae = float(np.mean(np.abs(y_true_flat - y_pred_flat)))
    rmse = float(np.sqrt(np.mean((y_true_flat - y_pred_flat) ** 2)))

    # R^2 Score
    ss_res = np.sum((y_true_flat - y_pred_flat) ** 2)
    ss_tot = np.sum((y_true_flat - np.mean(y_true_flat)) ** 2)
    r2 = float(1.0 - (ss_res / (ss_tot + 1e-8)))

    # At-risk classification accuracy (Threshold: delay >= 3.0 days)
    true_at_risk = y_true_flat >= 3.0
    pred_at_risk = y_pred_flat >= 3.0
    at_risk_acc = float(np.mean(true_at_risk == pred_at_risk))

    metrics = {
        "model_name": "SupplyChainGNN-GraphSAGE",
        "architecture": "3-Layer Lead-Time Modulated GraphSAGE with Residual Skip",
        "layers": 3,
        "hidden_dim": hidden_dim,
        "mae_days": round(mae, 2),
        "rmse_days": round(rmse, 2),
        "r2_score": round(r2, 3),
        "at_risk_accuracy": round(at_risk_acc * 100, 1),
        "total_training_scenarios": num_scenarios,
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "ready",
    }

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), MODEL_WEIGHTS_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Model saved to {MODEL_WEIGHTS_PATH}")
    logger.info(f"Test MAE: {mae:.2f} days | RMSE: {rmse:.2f} days | R²: {r2:.3f} | Accuracy: {at_risk_acc:.1%}")

    return model, metrics
