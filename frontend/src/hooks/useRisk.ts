import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { RiskNodeItem, RiskSummary } from '../types/risk';
import { GraphSummary } from '../types/graph';

export function useRisk() {
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [graphSummary, setGraphSummary] = useState<GraphSummary | null>(null);
  const [highRiskNodes, setHighRiskNodes] = useState<RiskNodeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rSummary, gSummary, highNodes] = await Promise.allSettled([
        api.getRiskSummary(),
        api.getGraphSummary(),
        api.getRiskNodes('HIGH', 20),
      ]);

      if (rSummary.status === 'fulfilled') setRiskSummary(rSummary.value);
      if (gSummary.status === 'fulfilled') setGraphSummary(gSummary.value);
      if (highNodes.status === 'fulfilled') setHighRiskNodes(highNodes.value.nodes || []);
    } catch (err: any) {
      console.error('Failed to load risk analytics:', err);
      setError('Unable to retrieve risk analytics from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  return {
    riskSummary,
    graphSummary,
    highRiskNodes,
    isLoading,
    error,
    refreshRisk: fetchRiskData,
  };
}
