import { useState, useEffect, useCallback } from 'react';
import { api, HealthResponse } from '../services/api';

export function useHealth(pollIntervalMs = 10000) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiOnline, setIsApiOnline] = useState(false);
  const [isNeo4jOnline, setIsNeo4jOnline] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setIsApiOnline(data.status === 'ok' || data.status === 'degraded');
      setIsNeo4jOnline(data.neo4j === 'connected');
    } catch {
      setIsApiOnline(false);
      setIsNeo4jOnline(false);
      setHealth({
        status: 'error',
        neo4j: 'disconnected',
        message: 'Backend server offline',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, pollIntervalMs]);

  return {
    health,
    isLoading,
    isApiOnline,
    isNeo4jOnline,
    refreshHealth: checkHealth,
  };
}
