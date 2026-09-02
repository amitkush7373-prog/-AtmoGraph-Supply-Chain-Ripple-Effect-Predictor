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

interface GlobalSupplyGraphProps {
  disruptedNodeId: string | null;
  rippleNodeIds: string[];
  onSelectNode: (nodeId: string) => void;
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
}) => {
  const { fitView } = useReactFlow();

  // Construct React Flow Nodes with Active Ripple States
  const flowNodes: Node[] = useMemo(() => {
    return BASE_NETWORK_NODES.map((node) => {
      const isDisrupted = disruptedNodeId === node.id;
      const isRippleAffected = rippleNodeIds.includes(node.id) || isDisrupted;

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
        },
      };
    });
  }, [disruptedNodeId, rippleNodeIds]);

  // Construct React Flow Edges with animated shockwave pulses
  const flowEdges: Edge[] = useMemo(() => {
    return BASE_NETWORK_EDGES.map((edge) => {
      const isSourceDisrupted = disruptedNodeId === edge.source;
      const isTargetAffected = rippleNodeIds.includes(edge.target);
      const isRipplePath = isSourceDisrupted || (rippleNodeIds.includes(edge.source) && isTargetAffected);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: Boolean(isRipplePath),
        style: {
          stroke: isSourceDisrupted
            ? '#EF4444'
            : isRipplePath
            ? '#F97316'
            : '#2A364F',
          strokeWidth: isRipplePath ? 2.5 : 1.2,
          opacity: isRipplePath ? 1 : 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSourceDisrupted ? '#EF4444' : isRipplePath ? '#F97316' : '#334155',
          width: 12,
          height: 12,
        },
      };
    });
  }, [disruptedNodeId, rippleNodeIds]);

  const [currentNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [currentEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.12, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <div className="relative w-full h-full bg-[#080C14] overflow-hidden select-none">
      {/* Top Banner Message */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300 shadow-xl backdrop-blur-md flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>Click a news event on the left to simulate a supply chain disruption</span>
        </div>
      </div>

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
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

      {/* Bottom-Left Floating Legend: Node Categories */}
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

      {/* Bottom-Right Floating Legend: AI Pipeline */}
      <div className="absolute bottom-4 right-16 z-20 bg-[#0B0F19]/90 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 select-none min-w-[150px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800/80 pb-1 flex items-center space-x-1">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>AI Pipeline</span>
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
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold">Ripple Prediction</span>
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
