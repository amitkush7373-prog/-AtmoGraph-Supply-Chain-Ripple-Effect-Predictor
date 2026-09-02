import { Node, Edge, MarkerType } from 'reactflow';
import { GraphNode, GraphEdge } from '../types/graph';

// Dedicated horizontal lanes for the 6 supply-chain tiers
const TIER_LANE_X: Record<string, number> = {
  Supplier: 80,
  Manufacturer: 520,
  Port: 960,
  Warehouse: 1400,
  Distributor: 1840,
  Product: 2280,
};

const DEFAULT_LANE_X = 1200;

export function transformToReactFlow(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedNodeId?: string | null
): { flowNodes: Node[]; flowEdges: Edge[] } {
  // Group nodes by tier
  const tierCounts: Record<string, number> = {
    Supplier: 0,
    Manufacturer: 0,
    Port: 0,
    Warehouse: 0,
    Distributor: 0,
    Product: 0,
  };

  const flowNodes: Node[] = nodes.map((node) => {
    const tier = node.label || node.type || 'Supplier';
    const baseX = TIER_LANE_X[tier] ?? DEFAULT_LANE_X;
    const indexInTier = tierCounts[tier] || 0;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    // Sub-column layout if tier has many nodes to prevent excessive vertical height
    const subCol = indexInTier > 7 ? (indexInTier % 2) * 190 : 0;
    const row = indexInTier > 7 ? Math.floor(indexInTier / 2) : indexInTier;

    const x = baseX + subCol;
    const y = 80 + row * 135;

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
          fill: '#CBD5E1',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
        },
        labelBgStyle: {
          fill: '#0F172A',
          fillOpacity: 0.92,
        },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: isConnectedToSelected
            ? '#38BDF8'
            : isHighRisk
            ? '#F97316'
            : '#334155',
          strokeWidth: isConnectedToSelected ? 2.5 : isHighRisk ? 2 : 1.4,
          opacity: selectedNodeId ? (isConnectedToSelected ? 1 : 0.2) : 0.75,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConnectedToSelected
            ? '#38BDF8'
            : isHighRisk
            ? '#F97316'
            : '#475569',
          width: 16,
          height: 16,
        },
      };
    });

  return { flowNodes, flowEdges };
}
