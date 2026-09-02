import { NodeRiskUpdate, RiskLevel } from './risk';

export interface ExtractedEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  normalized: string;
}

export interface MatchedNode {
  id: string;
  name: string;
  label: string;
  type: string;
  country?: string;
  city?: string;
  match_type: 'city_match' | 'country_match' | 'name_match' | 'alias_match';
  confidence: number;
}

export interface RippleEffectItem {
  id: string;
  name: string;
  label: string;
  type: string;
  parent_id: string;
  parent_name: string;
  relationship: string;
  previous_risk: RiskLevel;
  new_risk: RiskLevel;
  previous_score: number;
  new_score: number;
  impact_reason: string;
}

export interface NewsAnalyzeRequest {
  text: string;
  severity_override?: RiskLevel;
  propagate_ripple?: boolean;
}

export interface NewsAnalyzeResponse {
  text: string;
  entities: ExtractedEntity[];
  severity: RiskLevel;
  severity_score: number;
  matched_keywords: string[];
  matched_nodes: MatchedNode[];
  risk_updates: NodeRiskUpdate[];
  ripple_effects: RippleEffectItem[];
  disruption_event_id?: string;
  timestamp: string;
  message: string;
}

export interface DisruptionEventDetail {
  id: string;
  title?: string;
  text: string;
  severity: string;
  severity_score: number;
  matched_keywords: string[];
  timestamp: string;
  affected_nodes_count: number;
}
