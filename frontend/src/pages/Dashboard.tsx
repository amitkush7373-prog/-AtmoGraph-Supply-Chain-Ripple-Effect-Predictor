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
  } = useGraph({ limit: 50 });

  const { riskSummary, graphSummary, highRiskNodes, isLoading: isRiskLoading } = useRisk();
  const [showHotspots, setShowHotspots] = React.useState<boolean>(true);

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

        {/* Collapsible Hotspots Floating Panel */}
        {highRiskNodes.length > 0 && !selectedNodeDetail && (
          <div className="absolute bottom-4 right-4 z-10 w-80 max-w-[calc(100vw-2rem)] shadow-2xl">
            {showHotspots ? (
              <div className="relative">
                <button
                  onClick={() => setShowHotspots(false)}
                  className="absolute top-2.5 right-2.5 z-20 text-[10px] font-bold text-slate-400 hover:text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"
                >
                  Hide
                </button>
                <HotspotsList
                  nodes={highRiskNodes.slice(0, 4)}
                  onSelectNode={selectNode}
                  isLoading={isRiskLoading}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowHotspots(true)}
                className="px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-dark-700 shadow-xl flex items-center space-x-2"
              >
                <span>⚠️ Show Hotspots ({highRiskNodes.length})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
