import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { GraphEdge, GraphFilters, GraphNode, NodeDetail } from '../types/graph';

export function useGraph(initialFilters?: GraphFilters) {
  const [filters, setFilters] = useState<GraphFilters>(initialFilters || { limit: 50 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [totalNodes, setTotalNodes] = useState<number>(0);
  const [totalLinks, setTotalLinks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected node & inspector state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<NodeDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const fetchGraph = useCallback(async (customFilters?: GraphFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = customFilters || filters;
      const data = await api.getGraph(activeFilters);
      setNodes(data.nodes || []);
      setEdges(data.links || []);
      setTotalNodes(data.total_nodes || data.nodes?.length || 0);
      setTotalLinks(data.total_links || data.links?.length || 0);
    } catch (err: any) {
      console.error('Failed to load graph:', err);
      const msg = err.response?.data?.detail || err.message || 'Unable to connect to AtmoGraph Graph API.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Load detailed node info on selection
  const selectNode = useCallback(async (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) {
      setSelectedNodeDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    try {
      const detail = await api.getNodeDetail(nodeId);
      setSelectedNodeDetail(detail);
    } catch (err: any) {
      console.error(`Failed to fetch node detail for ${nodeId}:`, err);
      // Fallback to local node from memory if network lookup fails
      const local = nodes.find((n) => n.id === nodeId);
      if (local) {
        setSelectedNodeDetail({
          ...local,
          type: local.type || local.label,
          incoming_connections: [],
          outgoing_connections: [],
          total_connections: 0,
          recent_disruptions: [],
        });
      }
    } finally {
      setIsLoadingDetail(false);
    }
  }, [nodes]);

  const updateFilters = useCallback((newFilters: Partial<GraphFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ limit: 1000 });
  }, []);

  return {
    nodes,
    edges,
    totalNodes,
    totalLinks,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refreshGraph: fetchGraph,
    selectedNodeId,
    selectedNodeDetail,
    isLoadingDetail,
    selectNode,
  };
}
