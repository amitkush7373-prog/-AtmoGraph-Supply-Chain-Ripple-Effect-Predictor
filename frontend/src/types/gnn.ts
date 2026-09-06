export interface GNNNodePrediction {
  id: string;
  name: string;
  type: string;
  predicted_delay_days: number;
  predicted_risk_score: number;
  previous_risk_score: number;
  is_at_risk: boolean;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  hops_from_disruption: number;
  contributing_epicenter?: string;
  explanation: string;
}

export interface GNNPredictResponse {
  epicenter_node_ids: string[];
  severity: string;
  severity_score: number;
  total_at_risk_nodes: number;
  max_delay_days: number;
  avg_delay_days: number;
  confidence: number;
  inference_time_ms: number;
  node_predictions: GNNNodePrediction[];
  timestamp: string;
}

export interface GNNModelMetrics {
  model_name: string;
  architecture: string;
  layers: number;
  hidden_dim: number;
  mae_days: number;
  rmse_days: number;
  r2_score: number;
  at_risk_accuracy: number;
  total_training_scenarios: number;
  trained_at: string;
  status: string;
}

export interface GNNPredictRequest {
  epicenter_node_ids?: string[];
  severity?: string;
  text?: string;
  delay_threshold?: number;
}

export interface GNNPresetScenario {
  id: string;
  title: string;
  epicenter_node_ids: string[];
  severity: string;
  headline: string;
}
