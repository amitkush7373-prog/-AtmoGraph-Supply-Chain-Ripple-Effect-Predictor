#!/usr/bin/env python3
"""
AtmoGraph - Week 3: Graph Neural Network (GNN) Model Trainer
Trains SupplyChainGNN for node regression to predict downstream supply chain delays.

Usage:
    python scripts/train_gnn.py [--epochs 80] [--scenarios 400]
"""

import argparse
import os
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.gnn_training import train_gnn_model


def parse_args():
    parser = argparse.ArgumentParser(description="Train SupplyChainGNN for Delay Node Regression")
    parser.add_argument("--epochs", type=int, default=60, help="Number of training epochs")
    parser.add_argument("--scenarios", type=int, default=350, help="Number of simulation scenarios")
    parser.add_argument("--hidden-dim", type=int, default=64, help="GNN hidden dimension")
    parser.add_argument("--lr", type=float, default=0.005, help="Learning rate")
    return parser.parse_args()


def print_banner(title: str):
    print("\n" + "=" * 76)
    print(f"  {title}")
    print("=" * 76)


def main():
    args = parse_args()
    print_banner("ATMOGRAPH WEEK 3 - GRAPH NEURAL NETWORK (GNN) ENGINEERING")
    print("Task: Node Regression for Downstream Delays (Days) & Risk Elevation")
    print("Architecture: 3-Layer Lead-Time Modulated GraphSAGE + Residual Connections")
    print(f"Hyperparameters: Epochs={args.epochs}, Scenarios={args.scenarios}, HiddenDim={args.hidden_dim}, LR={args.lr}\n")

    start_time = time.time()
    model, metrics = train_gnn_model(
        epochs=args.epochs,
        learning_rate=args.lr,
        hidden_dim=args.hidden_dim,
        num_scenarios=args.scenarios,
    )
    elapsed = time.time() - start_time

    print_banner("TRAINING COMPLETE & BENCHMARK RESULTS")
    print(f"  * Model Name:             {metrics['model_name']}")
    print(f"  * Architecture:           {metrics['architecture']}")
    print(f"  * Mean Absolute Error:    {metrics['mae_days']} days (Target: < 2.0 days)")
    print(f"  * Root Mean Square Error: {metrics['rmse_days']} days")
    print(f"  * R² Determination Score: {metrics['r2_score']} (Target: > 0.85)")
    print(f"  * At-Risk Classification: {metrics['at_risk_accuracy']}% accuracy")
    print(f"  * Training Duration:      {elapsed:.1f}s")
    print(f"  * Artifact Saved:         app/models/gnn_delay_model.pt")
    print(f"  * Metrics Saved:          app/models/gnn_metrics.json")
    print("=" * 76 + "\n")


if __name__ == "__main__":
    main()
