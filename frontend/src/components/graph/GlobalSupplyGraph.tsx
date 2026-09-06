import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  NodeTypes,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CircularNode, CircularNodeData } from './CircularNode';
import { Database, Brain, Sparkles, Activity } from 'lucide-react';
import { PredictiveOverlayToolbar } from './PredictiveOverlayToolbar';
import { GNNAnalyticsDrawer } from './GNNAnalyticsDrawer';
import { GNNModelMetrics, GNNNodePrediction } from '../../types/gnn';

export interface GlobalSupplyGraphProps {
  disruptedNodeId: string | null;
  rippleNodeIds: string[];
  onSelectNode: (nodeId: string) => void;
  gnnPredictions?: GNNNodePrediction[];
  gnnMetrics?: GNNModelMetrics | null;
  isPredictiveMode?: boolean;
  onTogglePredictiveMode?: () => void;
  delayThreshold?: number;
  onSelectThreshold?: (threshold: number) => void;
}

const nodeTypes: NodeTypes = {
  circular: CircularNode,
};

// Organic Force-Directed Supply Chain Coordinates matching presentation
const BASE_NETWORK_NODES: Array<{
  id: string;
  name: string;
  category: CircularNodeData['category'];
  x: number;
  y: number;
}> = [
  // 1. Raw Materials (Bottom layer)
  { id: 'RAW_LITHIUM', name: 'Lithium (Australia)', category: 'raw', x: 740, y: 520 },
  { id: 'RAW_COBALT', name: 'Cobalt (Congo)', category: 'raw', x: 610, y: 560 },
  { id: 'RAW_COPPER', name: 'Copper (Chile)', category: 'raw', x: 480, y: 540 },
  { id: 'RAW_RARE_EARTH', name: 'Rare Earth Metals (China)', category: 'raw', x: 330, y: 470 },

  // 2. Components (Mid-low layer)
  { id: 'MAN_01453', name: 'Wafers (Taiwan)', category: 'component', x: 230, y: 370 },
  { id: 'CMP_DISPLAY', name: 'Display Panels (Japan)', category: 'component', x: 840, y: 440 },
  { id: 'CMP_BATTERY', name: 'Battery Cells (S. Korea)', category: 'component', x: 690, y: 450 },

  // 3. Manufacturers (Mid layer)
  { id: 'MAN_SHENZHEN', name: 'Electronics Assembly (Shenzhen)', category: 'manufacturer', x: 490, y: 440 },
  { id: 'MAN_MEXICO', name: 'Appliance Mfg (Mexico)', category: 'manufacturer', x: 420, y: 480 },
  { id: 'MAN_TEXAS', name: 'Device Assembly (Texas)', category: 'manufacturer', x: 470, y: 375 },
  { id: 'MAN_STUTTGART', name: 'Auto Assembly (Stuttgart)', category: 'manufacturer', x: 400, y: 320 },

  // 4. Ports & Maritime Hubs (Central backbone)
  { id: 'PRT_0004', name: 'Port of Shanghai', category: 'port', x: 620, y: 280 },
  { id: 'HUB_SUEZ', name: 'Suez Canal', category: 'port', x: 570, y: 355 },
  { id: 'PRT_0001', name: 'Port of Rotterdam', category: 'port', x: 480, y: 260 },
  { id: 'PRT_LA', name: 'Port of Los Angeles', category: 'port', x: 370, y: 290 },
  { id: 'HUB_PANAMA', name: 'Panama Canal', category: 'port', x: 410, y: 380 },

  // 5. Warehouses / DCs (Upper layer)
  { id: 'WH_EU', name: 'EU Distribution Center', category: 'warehouse', x: 465, y: 190 },
  { id: 'WH_US', name: 'US Distribution Center', category: 'warehouse', x: 310, y: 280 },

  // 6. Retail & Consumer Markets (Top layer)
  { id: 'RET_GLOBAL', name: 'Global Retail Network', category: 'retailer', x: 370, y: 165 },
  { id: 'CONS_EU', name: 'European Consumers', category: 'consumer', x: 410, y: 90 },
  { id: 'CONS_US', name: 'N. American Consumers', category: 'consumer', x: 260, y: 235 },
];

const BASE_NETWORK_EDGES: Array<{
  id: string;
  source: string;
  target: string;
}> = [
  // Raw to Components
  { id: 'e1', source: 'RAW_LITHIUM', target: 'CMP_BATTERY' },
  { id: 'e2', source: 'RAW_COBALT', target: 'CMP_BATTERY' },
  { id: 'e3', source: 'RAW_COPPER', target: 'MAN_SHENZHEN' },
  { id: 'e4', source: 'RAW_RARE_EARTH', target: 'MAN_01453' },
  { id: 'e5', source: 'RAW_RARE_EARTH', target: 'MAN_SHENZHEN' },

  // Components to Manufacturers & Ports
  { id: 'e6', source: 'CMP_DISPLAY', target: 'MAN_SHENZHEN' },
  { id: 'e7', source: 'CMP_BATTERY', target: 'MAN_SHENZHEN' },
  { id: 'e8', source: 'MAN_01453', target: 'PRT_0004' },
  { id: 'e9', source: 'MAN_01453', target: 'MAN_TEXAS' },
  { id: 'e10', source: 'MAN_SHENZHEN', target: 'PRT_0004' },

  // Ports to Global Trade Hubs
  { id: 'e11', source: 'PRT_0004', target: 'HUB_SUEZ' },
  { id: 'e12', source: 'HUB_SUEZ', target: 'PRT_0001' },
  { id: 'e13', source: 'PRT_0004', target: 'PRT_LA' },
  { id: 'e14', source: 'PRT_LA', target: 'WH_US' },
  { id: 'e15', source: 'PRT_LA', target: 'MAN_TEXAS' },

  // Manufacturers to Regional Hubs
  { id: 'e16', source: 'MAN_MEXICO', target: 'HUB_PANAMA' },
  { id: 'e17', source: 'HUB_PANAMA', target: 'MAN_TEXAS' },
  { id: 'e18', source: 'MAN_TEXAS', target: 'WH_US' },
  { id: 'e19', source: 'PRT_0001', target: 'MAN_STUTTGART' },
  { id: 'e20', source: 'PRT_0001', target: 'WH_EU' },

  // Warehouses to Retail & Consumers
  { id: 'e21', source: 'MAN_STUTTGART', target: 'WH_EU' },
  { id: 'e22', source: 'WH_EU', target: 'RET_GLOBAL' },
  { id: 'e23', source: 'WH_EU', target: 'CONS_EU' },
  { id: 'e24', source: 'WH_US', target: 'RET_GLOBAL' },
  { id: 'e25', source: 'WH_US', target: 'CONS_US' },
  { id: 'e26', source: 'RET_GLOBAL', target: 'CONS_EU' },
  { id: 'e27', source: 'RET_GLOBAL', target: 'CONS_US' },
];

const GraphInner: React.FC<GlobalSupplyGraphProps> = ({
  disruptedNodeId,
  rippleNodeIds,
  onSelectNode,
  gnnPredictions = [],
  gnnMetrics = null,
  isPredictiveMode: externalPredictiveMode,
  onTogglePredictiveMode: externalTogglePredictiveMode,
  delayThreshold: externalDelayThreshold,
  onSelectThreshold: externalSelectThreshold,
}) => {
  const { fitView } = useReactFlow();

  // Local state fallbacks if not controlled from parent
  const [internalPredictiveMode, setInternalPredictiveMode] = React.useState<boolean>(true);
  const [internalThreshold, setInternalThreshold] = React.useState<number>(3);
  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = React.useState<boolean>(false);

  const isPredictive = externalPredictiveMode !== undefined ? externalPredictiveMode : internalPredictiveMode;
  const togglePredictive = externalTogglePredictiveMode || (() => setInternalPredictiveMode((prev) => !prev));
  const activeThreshold = externalDelayThreshold !== undefined ? externalDelayThreshold : internalThreshold;
  const setThreshold = externalSelectThreshold || setInternalThreshold;

  // Map predictions by ID for fast lookup
  const predictionMap = useMemo(() => {
    const map = new Map<string, GNNNodePrediction>();
    gnnPredictions.forEach((p) => map.set(p.id, p));
    return map;
  }, [gnnPredictions]);

  // Construct React Flow Nodes with Active Ripple & GNN Overlay States
  const flowNodes: Node[] = useMemo(() => {
    return BASE_NETWORK_NODES.map((node) => {
      const pred = predictionMap.get(node.id);
      const isDisrupted = disruptedNodeId === node.id;
      const isRippleAffected = rippleNodeIds.includes(node.id) || isDisrupted;

      const delayDays = pred?.predicted_delay_days ?? (isDisrupted ? 14.2 : isRippleAffected ? 7.5 : 0.4);
      const riskScore = pred?.predicted_risk_score ?? (isDisrupted ? 0.88 : isRippleAffected ? 0.62 : 0.15);
      const riskLevel = pred?.risk_level ?? (delayDays >= 10 ? 'CRITICAL' : delayDays >= 5 ? 'HIGH' : delayDays >= 2 ? 'MEDIUM' : 'LOW');
      const isAtRisk = (isDisrupted || isRippleAffected || (pred?.is_at_risk ?? false)) && delayDays >= activeThreshold;

      return {
        id: node.id,
        type: 'circular',
        position: { x: node.x, y: node.y },
        data: {
          id: node.id,
          name: node.name,
          category: node.category,
          isDisrupted,
          isRippleAffected,
          // Week 3 GNN Predictive Overlay
          isPredictiveMode: isPredictive,
          isAtRisk,
          predictedDelayDays: Math.round(delayDays * 10) / 10,
          predictedRiskScore: riskScore,
          riskLevel,
          explanation: pred?.explanation,
        },
      };
    });
  }, [disruptedNodeId, rippleNodeIds, predictionMap, isPredictive, activeThreshold]);

  // Calculate top-level stats for predictive toolbar
  const atRiskNodesCount = useMemo(() => {
    return flowNodes.filter((n) => n.data.isAtRisk).length;
  }, [flowNodes]);

  const maxPredictedDelay = useMemo(() => {
    return flowNodes.reduce((max, n) => Math.max(max, n.data.predictedDelayDays || 0), 0);
  }, [flowNodes]);

  const avgPredictedDelay = useMemo(() => {
    const total = flowNodes.reduce((sum, n) => sum + (n.data.predictedDelayDays || 0), 0);
    return Math.round((total / Math.max(1, flowNodes.length)) * 10) / 10;
  }, [flowNodes]);

  // Construct React Flow Edges with animated shockwave pulses
  const flowEdges: Edge[] = useMemo(() => {
    return BASE_NETWORK_EDGES.map((edge) => {
      const isSourceDisrupted = disruptedNodeId === edge.source;
      const isTargetAffected = rippleNodeIds.includes(edge.target);
      const isRipplePath = isSourceDisrupted || (rippleNodeIds.includes(edge.source) && isTargetAffected);

      const targetPred = predictionMap.get(edge.target);
      const isTargetAtRisk = (targetPred?.predicted_delay_days ?? (isTargetAffected ? 7.5 : 0)) >= activeThreshold;
      const isPredictiveRipple = isPredictive && (isSourceDisrupted || (isRipplePath && isTargetAtRisk));

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: Boolean(isPredictiveRipple || isRipplePath),
        style: {
          stroke: isSourceDisrupted
            ? '#EF4444'
            : isPredictiveRipple
            ? '#EF4444'
            : isRipplePath
            ? '#F97316'
            : '#1E293B',
          strokeWidth: isPredictiveRipple ? 2.8 : isRipplePath ? 2.2 : 1.2,
          opacity: isPredictiveRipple ? 1 : isRipplePath ? 0.9 : 0.45,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSourceDisrupted
            ? '#EF4444'
            : isPredictiveRipple
            ? '#EF4444'
            : isRipplePath
            ? '#F97316'
            : '#334155',
          width: 12,
          height: 12,
        },
      };
    });
  }, [disruptedNodeId, rippleNodeIds, isPredictive, predictionMap, activeThreshold]);

  const [currentNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [currentEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.14, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <div className="relative w-full h-full bg-[#080C14] overflow-hidden select-none">
      {/* 1. Week 3 Predictive Overlay Toolbar */}
      <PredictiveOverlayToolbar
        isPredictiveMode={isPredictive}
        onTogglePredictiveMode={togglePredictive}
        delayThreshold={activeThreshold}
        onSelectThreshold={setThreshold}
        atRiskCount={atRiskNodesCount}
        maxDelay={maxPredictedDelay}
        metrics={gnnMetrics}
        onToggleAnalyticsDrawer={() => setIsAnalyticsDrawerOpen((prev) => !prev)}
        isAnalyticsDrawerOpen={isAnalyticsDrawerOpen}
      />

      {/* 2. GNN Predictive Analytics Drawer */}
      <GNNAnalyticsDrawer
        isOpen={isAnalyticsDrawerOpen}
        onClose={() => setIsAnalyticsDrawerOpen(false)}
        predictions={gnnPredictions.length > 0 ? gnnPredictions : flowNodes.map((n) => ({
          id: n.id,
          name: n.data.name,
          type: n.data.category,
          predicted_delay_days: n.data.predictedDelayDays || 0,
          predicted_risk_score: n.data.predictedRiskScore || 0.1,
          previous_risk_score: 0.15,
          is_at_risk: Boolean(n.data.isAtRisk),
          risk_level: n.data.riskLevel || 'LOW',
          hops_from_disruption: n.data.isDisrupted ? 0 : n.data.isRippleAffected ? 1 : 0,
          explanation: n.data.explanation || 'Nominal operational state',
        }))}
        metrics={gnnMetrics}
        epicenterIds={disruptedNodeId ? [disruptedNodeId] : []}
        severity="HIGH"
        maxDelay={maxPredictedDelay}
        avgDelay={avgPredictedDelay}
        atRiskCount={atRiskNodesCount}
        confidence={gnnMetrics?.at_risk_accuracy || 98.3}
        onSelectNode={onSelectNode}
      />

      {/* 3. Main React Flow Canvas */}
      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E293B" gap={28} size={1} />
        <Controls
          className="!bg-slate-900/90 !border !border-slate-800 !rounded-lg !shadow-xl !bottom-4 !right-4"
          showInteractive={false}
        />
      </ReactFlow>

      {/* 4. Bottom-Left Floating Legend: Node Categories */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#0B0F19]/90 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 select-none min-w-[150px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800/80 pb-1">
          Node Categories
        </span>
        <div className="space-y-1.5 text-[11px] font-medium">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3B82F6]" />
            <span>Raw Material</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06B6D4]" />
            <span>Component</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#F59E0B]" />
            <span>Manufacturer</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_6px_#EC4899]" />
            <span>Port / Hub</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            <span>Warehouse</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_#8B5CF6]" />
            <span>Retailer</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#F97316]" />
            <span>Consumer Market</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom-Right Floating Legend: AI Pipeline */}
      <div className="absolute bottom-4 right-16 z-20 bg-[#0B0F19]/90 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 select-none min-w-[170px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800/80 pb-1 flex items-center space-x-1">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>AI Intelligence Pipeline</span>
        </span>
        <div className="space-y-1.5 text-[11px] font-medium">
          <div className="flex items-center space-x-2 text-slate-300">
            <Database className="w-3 h-3 text-cyan-400" />
            <span>Neo4j Graph DB</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>NLP Engine (spaCy)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Brain className="w-3 h-3 text-purple-400" />
            <span>GNN (GraphSAGE)</span>
            <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
              R²: 0.88
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            <span className="text-red-400 font-bold">Predictive Overlay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalSupplyGraph: React.FC<GlobalSupplyGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
};

