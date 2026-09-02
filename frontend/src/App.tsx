import { useState } from 'react';
import { Header } from './components/layout/Header';
import { StatCardsRow } from './components/dashboard/StatCardsRow';
import { LiveNewsFeed, DisruptionNewsItem } from './components/news/LiveNewsFeed';
import { GlobalSupplyGraph } from './components/graph/GlobalSupplyGraph';
import { ImpactAnalysisPanel } from './components/analysis/ImpactAnalysisPanel';
import { useHealth } from './hooks/useHealth';
import { useRisk } from './hooks/useRisk';
import { ExtractedEntity } from './types/news';
import { api } from './services/api';

const DOWNSTREAM_RIPPLE_MAP: Record<string, string[]> = {
  PRT_0001: ['WH_EU', 'MAN_STUTTGART', 'RET_GLOBAL', 'CONS_EU', 'CONS_US'],
  MAN_01453: ['PRT_0004', 'MAN_TEXAS', 'HUB_SUEZ', 'PRT_LA', 'WH_US', 'CONS_US'],
  HUB_SUEZ: ['PRT_0001', 'WH_EU', 'MAN_STUTTGART', 'RET_GLOBAL', 'CONS_EU'],
  RAW_COBALT: ['CMP_BATTERY', 'MAN_SHENZHEN', 'PRT_0004', 'PRT_LA', 'WH_US'],
  PRT_0004: ['HUB_SUEZ', 'PRT_LA', 'PRT_0001', 'WH_US', 'WH_EU', 'CONS_EU', 'CONS_US'],
};

const DOWNSTREAM_NAME_MAP: Record<string, string[]> = {
  PRT_0001: [
    'EU Distribution Center (WH_EU)',
    'Auto Assembly (Stuttgart)',
    'Global Retail Network',
    'European Consumers',
    'N. American Consumers',
  ],
  MAN_01453: [
    'Port of Shanghai',
    'Device Assembly (Texas)',
    'US Distribution Center',
    'Global Retail Network',
    'N. American Consumers',
  ],
  HUB_SUEZ: [
    'Port of Rotterdam',
    'EU Distribution Center',
    'Auto Assembly (Stuttgart)',
    'Global Retail Network',
    'European Consumers',
  ],
  RAW_COBALT: [
    'Battery Cells (S. Korea)',
    'Electronics Assembly (Shenzhen)',
    'Port of Shanghai',
    'US Distribution Center',
  ],
  PRT_0004: [
    'Suez Canal Trade Passage',
    'Port of Los Angeles',
    'Port of Rotterdam',
    'US Distribution Center',
    'EU Distribution Center',
  ],
};

export function App() {
  const { health, isApiOnline, isNeo4jOnline, refreshHealth } = useHealth();
  const { refreshRisk } = useRisk();

  const [activeNews, setActiveNews] = useState<DisruptionNewsItem | null>(null);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Simulation Metrics
  const [metrics, setMetrics] = useState({
    nodesAffected: null as number | null,
    maxRippleHops: null as number | null,
    estDelayDays: null as number | null,
    estCostImpact: null as string | null,
    confidencePercent: null as number | null,
  });

  const [disruptedNodeId, setDisruptedNodeId] = useState<string | null>(null);
  const [rippleNodeIds, setRippleNodeIds] = useState<string[]>([]);
  const [affectedNames, setAffectedNames] = useState<string[]>([]);

  const handleSimulateNews = async (news: DisruptionNewsItem) => {
    setActiveNews(news);
    setIsSimulating(true);

    const targetId = news.targetNodeId || 'PRT_0001';
    setDisruptedNodeId(targetId);

    const downstream = DOWNSTREAM_RIPPLE_MAP[targetId] || ['WH_EU', 'CONS_EU'];
    setRippleNodeIds(downstream);

    const names = DOWNSTREAM_NAME_MAP[targetId] || [
      'EU Distribution Center',
      'Global Retail Network',
      'European Consumers',
    ];
    setAffectedNames(names);

    // Update Top 5 Stat Cards
    setMetrics({
      nodesAffected: news.rippleNodesCount,
      maxRippleHops: news.hops,
      estDelayDays: news.estDelay,
      estCostImpact: news.estCost,
      confidencePercent: 94,
    });

    // Call Real spaCy NLP backend for live NER entity extraction
    try {
      const res = await api.analyzeNews({ text: news.rawText });
      if (res.entities && res.entities.length > 0) {
        setExtractedEntities(res.entities);
      } else {
        setExtractedEntities([
          { text: news.targetNodeName || 'Port', label: 'GPE', start: 0, end: 10, normalized: targetId.toLowerCase() },
          { text: news.tags[0] || 'Global', label: 'LOC', start: 12, end: 18, normalized: news.tags[0]?.toLowerCase() || 'loc' },
        ]);
      }
    } catch {
      // Fallback
      setExtractedEntities([
        { text: news.targetNodeName || 'Port', label: 'GPE', start: 0, end: 10, normalized: targetId.toLowerCase() },
        { text: news.tags[0] || 'Global', label: 'LOC', start: 12, end: 18, normalized: news.tags[0]?.toLowerCase() || 'loc' },
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setActiveNews(null);
    setDisruptedNodeId(null);
    setRippleNodeIds([]);
    setAffectedNames([]);
    setExtractedEntities([]);
    setMetrics({
      nodesAffected: null,
      maxRippleHops: null,
      estDelayDays: null,
      estCostImpact: null,
      confidencePercent: null,
    });
  };

  const handleRefreshAll = () => {
    refreshHealth();
    refreshRisk();
    handleResetSimulation();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080C14] text-slate-100 font-sans select-none">
      {/* 1. Header Bar */}
      <Header
        health={health}
        isApiOnline={isApiOnline}
        isNeo4jOnline={isNeo4jOnline}
        onRefreshAll={handleRefreshAll}
      />

      {/* 2. Top 5 Metrics Row */}
      <StatCardsRow metrics={metrics} />

      {/* 3. Main 3-Column Intelligence Operations Center */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Live News Feed */}
        <LiveNewsFeed
          selectedNewsId={activeNews?.id || null}
          onSimulateNews={handleSimulateNews}
          isSimulating={isSimulating}
        />

        {/* Center: Global Supply Graph Canvas */}
        <main className="flex-1 relative h-full min-w-0 bg-[#080C14]">
          <GlobalSupplyGraph
            disruptedNodeId={disruptedNodeId}
            rippleNodeIds={rippleNodeIds}
            onSelectNode={(nodeId) => {
              const matchedNews = Object.entries(DOWNSTREAM_RIPPLE_MAP).find(([key]) => key === nodeId);
              if (matchedNews) {
                setDisruptedNodeId(nodeId);
                setRippleNodeIds(DOWNSTREAM_RIPPLE_MAP[nodeId] || []);
              }
            }}
          />
        </main>

        {/* Right: Impact Analysis Panel */}
        <ImpactAnalysisPanel
          activeNews={activeNews}
          extractedEntities={extractedEntities}
          affectedNodeNames={affectedNames}
          onResetSimulation={handleResetSimulation}
        />
      </div>
    </div>
  );
}

export default App;
