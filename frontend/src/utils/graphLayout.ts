import { Node, Edge, MarkerType } from 'reactflow';
import { GraphNode, GraphEdge } from '../types/graph';

// Configuration for supply chain tier grid positioning
interface TierLayoutConfig {
  baseX: number;
  columns: number;
  colSpacing: number;
  rowSpacing: number;
}

const TIER_CONFIGS: Record<string, TierLayoutConfig> = {
  Supplier: {
    baseX: 50,
    columns: 4,
    colSpacing: 250,
    rowSpacing: 100,
  },
  Manufacturer: {
    baseX: 1150,
    columns: 3,
    colSpacing: 250,
    rowSpacing: 105,
  },
  Port: {
    baseX: 2000,
    columns: 2,
    colSpacing: 250,
    rowSpacing: 110,
  },
  Warehouse: {
    baseX: 2600,
    columns: 3,
    colSpacing: 250,
    rowSpacing: 105,
  },
  Distributor: {
    baseX: 3450,
    columns: 3,
    colSpacing: 250,
    rowSpacing: 105,
  },
  Product: {
    baseX: 4300,
    columns: 2,
    colSpacing: 250,
    rowSpacing: 110,
  },
};

const DEFAULT_CONFIG: TierLayoutConfig = {
  baseX: 1000,
  columns: 3,
  colSpacing: 250,
  rowSpacing: 100,
};

export function transformToReactFlow(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedNodeId?: string | null
): { flowNodes: Node[]; flowEdges: Edge[] } {
  // Counters for nodes in each tier to arrange in a clean 2D grid
  const tierCounters: Record<string, number> = {
    Supplier: 0,
    Manufacturer: 0,
    Port: 0,
    Warehouse: 0,
    Distributor: 0,
    Product: 0,
  };

  const flowNodes: Node[] = nodes.map((node) => {
    const tier = node.label || node.type || 'Supplier';
    const config = TIER_CONFIGS[tier] || DEFAULT_CONFIG;
    const indexInTier = tierCounters[tier] || 0;
    tierCounters[tier] = (tierCounters[tier] || 0) + 1;

    const col = indexInTier % config.columns;
    const row = Math.floor(indexInTier / config.columns);

    const x = config.baseX + col * config.colSpacing;
    const y = 80 + row * config.rowSpacing;

    const isSelected = selectedNodeId === node.id;

    return {
      id: node.id,
      type: 'custom',
      position: { x, y },
      data: {
        ...node,
        isSelected,
      },
      selected: isSelected,
    };
  });

  const validNodeIds = new Set(nodes.map((n) => n.id));

  const flowEdges: Edge[] = edges
    .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map((edge) => {
      const isConnectedToSelected =
        selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

      const isHighRisk = (edge.risk_score || 0) >= 0.6;

      return {
        id: edge.id || `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: Boolean(isConnectedToSelected || isHighRisk),
        label: edge.relationship || edge.type,
        labelStyle: {
          fill: '#94A3B8',
          fontSize: 10,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
        },
        labelBgStyle: {
          fill: '#0B0F19',
          fillOpacity: 0.85,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: isConnectedToSelected
            ? '#38BDF8'
            : isHighRisk
            ? '#F97316'
            : '#334155',
          strokeWidth: isConnectedToSelected ? 2.5 : isHighRisk ? 2 : 1.2,
          opacity: selectedNodeId ? (isConnectedToSelected ? 1 : 0.25) : 0.75,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConnectedToSelected
            ? '#38BDF8'
            : isHighRisk
            ? '#F97316'
            : '#475569',
          width: 14,
          height: 14,
        },
      };
    });

  return { flowNodes, flowEdges };
}
