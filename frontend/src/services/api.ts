import axios from 'axios';
import { GraphFilters, GraphResponse, GraphSummary, NodeDetail } from '../types/graph';
import { RiskLevel, RiskNodeItem, RiskSummary } from '../types/risk';
import { DisruptionEventDetail, NewsAnalyzeRequest, NewsAnalyzeResponse } from '../types/news';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export interface HealthResponse {
  status: string;
  neo4j: 'connected' | 'disconnected';
  database?: string;
  version?: string;
  environment?: string;
  message?: string;
}

export const api = {
  // System Health
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/health');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as HealthResponse;
      }
      return {
        status: 'error',
        neo4j: 'disconnected',
        message: 'Backend server unreachable',
      };
    }
  },

  // Graph Endpoints
  async getGraph(filters?: GraphFilters): Promise<GraphResponse> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.nodeType && filters.nodeType !== 'ALL') params.append('type', filters.nodeType);
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') params.append('risk', filters.riskLevel);
    if (filters?.country && filters.country !== 'ALL') params.append('country', filters.country);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<GraphResponse>(`/graph?${params.toString()}`);
    return response.data;
  },

  async getGraphSummary(): Promise<GraphSummary> {
    const response = await apiClient.get<GraphSummary>('/graph/summary');
    return response.data;
  },

  async getNodeDetail(nodeId: string): Promise<NodeDetail> {
    const response = await apiClient.get<NodeDetail>(`/graph/node/${encodeURIComponent(nodeId)}`);
    return response.data;
  },

  // Entity Endpoints
  async getEntities(params?: { q?: string; type?: string; country?: string; risk?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.country && params.country !== 'ALL') query.append('country', params.country);
    if (params?.risk && params.risk !== 'ALL') query.append('risk', params.risk);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const response = await apiClient.get<{ total: number; items: any[] }>(`/entities?${query.toString()}`);
    return response.data;
  },

  // Risk Endpoints
  async getRiskSummary(): Promise<RiskSummary> {
    const response = await apiClient.get<RiskSummary>('/risk/summary');
    return response.data;
  },

  async getRiskNodes(level?: RiskLevel, limit = 50, offset = 0): Promise<{ total: number; nodes: RiskNodeItem[] }> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await apiClient.get<{ total: number; nodes: RiskNodeItem[] }>(`/risk/nodes?${params.toString()}`);
    return response.data;
  },

  // News / Disruption Analysis
  async analyzeNews(payload: NewsAnalyzeRequest): Promise<NewsAnalyzeResponse> {
    const response = await apiClient.post<NewsAnalyzeResponse>('/news/analyze', payload);
    return response.data;
  },

  async getNewsEvents(limit = 20): Promise<{ total: number; events: DisruptionEventDetail[] }> {
    const response = await apiClient.get<{ total: number; events: DisruptionEventDetail[] }>(`/news/events?limit=${limit}`);
    return response.data;
  },

  // GNN Predictive Endpoints
  async predictGNN(payload: import('../types/gnn').GNNPredictRequest): Promise<import('../types/gnn').GNNPredictResponse> {
    const response = await apiClient.post<import('../types/gnn').GNNPredictResponse>('/gnn/predict', payload);
    return response.data;
  },

  async getGNNMetrics(): Promise<import('../types/gnn').GNNModelMetrics> {
    const response = await apiClient.get<import('../types/gnn').GNNModelMetrics>('/gnn/metrics');
    return response.data;
  },

  async getGNNPresets(): Promise<import('../types/gnn').GNNPresetScenario[]> {
    const response = await apiClient.get<import('../types/gnn').GNNPresetScenario[]>('/gnn/presets');
    return response.data;
  },

  async predictGNNPreset(presetId: string): Promise<import('../types/gnn').GNNPredictResponse> {
    const response = await apiClient.get<import('../types/gnn').GNNPredictResponse>(`/gnn/preset/${encodeURIComponent(presetId)}`);
    return response.data;
  },
};
