import { RiskDistribution, RiskLevel } from './risk';

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  name: string;
  country?: string;
  city?: string;
  region?: string;
  industry?: string;
  risk: RiskLevel;
  risk_score: number;
  status: string;
  risk_reason?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  relationship?: string;
  lead_time_days?: number;
  risk_score?: number;
  status?: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphEdge[];
  total_nodes: number;
  total_links: number;
  limit: number;
  offset: number;
}

export interface GraphSummary {
  total_nodes: number;
  total_relationships: number;
  nodes_by_type: Record<string, number>;
  risk_distribution: RiskDistribution;
  nodes_by_country: Record<string, number>;
  nodes_by_industry: Record<string, number>;
  recent_disruptions_count: number;
}

export interface ConnectedNode {
  id: string;
  name: string;
  label: string;
  relationship: string;
  direction: 'outgoing' | 'incoming';
  lead_time_days?: number;
  risk?: RiskLevel;
  risk_score?: number;
  status?: string;
}

export interface DisruptionEventSummary {
  id: string;
  title?: string;
  severity: string;
  timestamp: string;
  risk_delta?: number;
}

export interface NodeDetail {
  id: string;
  name: string;
  label: string;
  type: string;
  country?: string;
  city?: string;
  industry?: string;
  risk: RiskLevel;
  risk_score: number;
  status: string;
  risk_reason?: string;
  updated_at?: string;
  incoming_connections: ConnectedNode[];
  outgoing_connections: ConnectedNode[];
  total_connections: number;
  recent_disruptions: DisruptionEventSummary[];
}

export interface GraphFilters {
  nodeType?: string;
  riskLevel?: string;
  country?: string;
  search?: string;
  limit?: number;
}
