import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple


class LeadTimeGraphSAGELayer(nn.Module):
    """
    GraphSAGE Message Passing Layer modulated by directional supply chain lead times.
    Downstream facilities aggregate upstream supplier disruption signals weighted
    by route transmission efficiency.
    """
    def __init__(self, in_features: int, out_features: int, dropout: float = 0.1):
        super().__init__()
        self.linear_self = nn.Linear(in_features, out_features)
        self.linear_neigh = nn.Linear(in_features, out_features)
        self.layer_norm = nn.LayerNorm(out_features)
        self.dropout = nn.Dropout(dropout)
        self.act = nn.LeakyReLU(negative_slope=0.1)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        """
        x: [N, in_features] or [B, N, in_features]
        adj_norm: [N, N] normalized directed adjacency matrix
        """
        # Aggregate incoming upstream neighbor representations
        # If x is [B, N, D], torch.matmul(adj_norm, x) applies across batches
        neigh_agg = torch.matmul(adj_norm, x)

        # Combine self-representation with aggregated upstream neighborhood
        h_self = self.linear_self(x)
        h_neigh = self.linear_neigh(neigh_agg)
        h = h_self + h_neigh

        h = self.layer_norm(h)
        h = self.act(h)
        h = self.dropout(h)
        return h


class SupplyChainGNN(nn.Module):
    """
    3-Layer Graph Neural Network for Supply Chain Delay Node Regression
    and Risk State Prediction.
    
    Inputs:
        x: [N, in_features=16] Node disruption feature tensor
        adj_norm: [N, N] Directed, lead-time modulated normalized adjacency matrix
        
    Outputs:
        predicted_delays: [N, 1] Continuous delay prediction (days >= 0)
        predicted_risks: [N, 1] Probability/Score of risk elevation (0.0 to 1.0)
    """
    def __init__(self, in_features: int = 16, hidden_dim: int = 64, dropout: float = 0.1):
        super().__init__()
        self.in_features = in_features
        self.hidden_dim = hidden_dim

        # Message Passing Layers
        self.layer1 = LeadTimeGraphSAGELayer(in_features, hidden_dim, dropout=dropout)
        self.layer2 = LeadTimeGraphSAGELayer(hidden_dim, hidden_dim, dropout=dropout)
        self.layer3 = LeadTimeGraphSAGELayer(hidden_dim, 32, dropout=dropout)

        # Multi-task Prediction Heads
        # Head 1: Continuous Node Delay Regression (Days)
        self.delay_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.LeakyReLU(0.1),
            nn.Linear(16, 1),
            nn.ReLU(),  # Enforces non-negative delay in days
        )

        # Head 2: Dynamic Node Risk Probability (0.0 - 1.0)
        self.risk_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.LeakyReLU(0.1),
            nn.Linear(16, 1),
            nn.Sigmoid(),  # Bound output to [0, 1]
        )

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # Layer 1 Message Passing
        h1 = self.layer1(x, adj_norm)

        # Layer 2 Message Passing with Residual Connection
        h2 = self.layer2(h1, adj_norm)
        h2 = h2 + h1  # Skip connection

        # Layer 3 Message Passing (3-Hop Ripple Reach)
        h3 = self.layer3(h2, adj_norm)

        # Multi-task heads
        pred_delay = self.delay_head(h3)
        pred_risk = self.risk_head(h3)

        return pred_delay, pred_risk
