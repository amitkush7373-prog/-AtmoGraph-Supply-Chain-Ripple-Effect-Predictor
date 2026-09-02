import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Analysis } from './pages/Analysis';
import { useHealth } from './hooks/useHealth';
import { useRisk } from './hooks/useRisk';
import { GraphCanvas } from './components/graph/GraphCanvas';
import { FilterPanel } from './components/layout/FilterPanel';
import { useGraph } from './hooks/useGraph';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { health, isApiOnline, isNeo4jOnline, refreshHealth } = useHealth();
  const { riskSummary, refreshRisk } = useRisk();

  // Standalone graph workspace state for the dedicated 'graph' tab
  const {
    nodes,
    edges,
    totalNodes,
    totalLinks,
    isLoading: isGraphLoading,
    error: graphError,
    filters,
    updateFilters,
    resetFilters,
    refreshGraph,
    selectedNodeId,
    selectedNodeDetail,
    isLoadingDetail,
    selectNode,
  } = useGraph({ limit: 50 });

  const handleRefreshAll = () => {
    refreshHealth();
    refreshRisk();
    refreshGraph();
  };

  const handleSelectNodeFromAnalysis = (nodeId: string) => {
    selectNode(nodeId);
    setActiveTab('graph');
  };

  const hasActiveFilters = Boolean(
    (filters.nodeType && filters.nodeType !== 'ALL') ||
      (filters.riskLevel && filters.riskLevel !== 'ALL') ||
      filters.country ||
      filters.search
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-dark-900 text-slate-100 font-sans">
      {/* 1. Global Header */}
      <Header
        health={health}
        isApiOnline={isApiOnline}
        isNeo4jOnline={isNeo4jOnline}
        onRefreshAll={handleRefreshAll}
      />

      {/* 2. Main Body with Sidebar + Tab Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          criticalCount={riskSummary?.risk_distribution.CRITICAL || 0}
          highCount={riskSummary?.risk_distribution.HIGH || 0}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigateToAnalysis={() => setActiveTab('analysis')} />
          )}

          {activeTab === 'graph' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <FilterPanel
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
              />
              <div className="flex-1 relative w-full h-full min-h-0">
                <GraphCanvas
                  nodes={nodes}
                  edges={edges}
                  totalGraphNodes={totalNodes}
                  totalGraphEdges={totalLinks}
                  isLoading={isGraphLoading}
                  error={graphError}
                  onRetry={refreshGraph}
                  selectedNodeId={selectedNodeId}
                  selectedNodeDetail={selectedNodeDetail}
                  isLoadingDetail={isLoadingDetail}
                  onSelectNode={selectNode}
                  onResetFilters={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <Analysis onSelectNodeInGraph={handleSelectNodeFromAnalysis} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
