import React from 'react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { FilterPanel } from '../components/layout/FilterPanel';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { HotspotsList } from '../components/dashboard/HotspotsList';
import { useGraph } from '../hooks/useGraph';
import { useRisk } from '../hooks/useRisk';

interface DashboardProps {
  onNavigateToAnalysis?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const {
    nodes,
    edges,
    totalNodes,
    totalLinks,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refreshGraph,
    selectedNodeId,
    selectedNodeDetail,
    isLoadingDetail,
    selectNode,
  } = useGraph({ limit: 250 });

  const { riskSummary, graphSummary, highRiskNodes, isLoading: isRiskLoading } = useRisk();

  const hasActiveFilters = Boolean(
    (filters.nodeType && filters.nodeType !== 'ALL') ||
      (filters.riskLevel && filters.riskLevel !== 'ALL') ||
      filters.country ||
      filters.search
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-dark-900">
      {/* 1. Global Metrics Row */}
      <SummaryCards
        graphSummary={graphSummary}
        riskSummary={riskSummary}
        isLoading={isRiskLoading}
      />

      {/* 2. Interactive Filter Bar */}
      <FilterPanel
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* 3. Main Split View: Graph Canvas & Bottom Hotspots Inspector */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* Graph Workspace (React Flow) */}
        <div className="flex-1 relative w-full h-full min-h-[400px]">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            totalGraphNodes={totalNodes}
            totalGraphEdges={totalLinks}
            isLoading={isLoading}
            error={error}
            onRetry={refreshGraph}
            selectedNodeId={selectedNodeId}
            selectedNodeDetail={selectedNodeDetail}
            isLoadingDetail={isLoadingDetail}
            onSelectNode={selectNode}
            onResetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Bottom Drawer / Hotspots Drawer Toggle */}
        {highRiskNodes.length > 0 && !selectedNodeDetail && (
          <div className="absolute bottom-4 right-4 z-10 w-96 max-w-[calc(100vw-2rem)] shadow-2xl">
            <HotspotsList
              nodes={highRiskNodes.slice(0, 6)}
              onSelectNode={selectNode}
              isLoading={isRiskLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
