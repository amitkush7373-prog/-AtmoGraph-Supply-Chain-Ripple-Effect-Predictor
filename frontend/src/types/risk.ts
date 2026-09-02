export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NodeStatus =
  | 'OPERATIONAL'
  | 'DELAYED'
  | 'DISRUPTED'
  | 'CONGESTED'
  | 'HALTED'
  | 'MONITORING';

export interface RiskDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface RiskSummary {
  total_nodes: number;
  risk_distribution: RiskDistribution;
  average_risk_score: number;
  highest_risk_regions: Record<string, number>;
  highest_risk_industries: Record<string, number>;
}

export interface RiskNodeItem {
  id: string;
  name: string;
  type: string;
  country?: string;
  city?: string;
  industry?: string;
  risk: RiskLevel;
  risk_score: number;
  status?: string;
  risk_reason?: string;
  updated_at?: string;
}

export interface NodeRiskUpdate {
  id: string;
  name: string;
  type: string;
  previous_risk: RiskLevel;
  new_risk: RiskLevel;
  previous_score: number;
  new_score: number;
  status: NodeStatus;
  risk_reason: string;
  country?: string;
  city?: string;
}
