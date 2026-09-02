import { Node, Edge, MarkerType } from 'reactflow';
import { GraphNode, GraphEdge } from '../types/graph';

// Layer positions for supply chain tiering
const TIER_X_POSITIONS: Record<string, number> = {
  Supplier: 100,
  Manufacturer: 600,
  Port: 1100,
  Warehouse: 1600,
  Distributor: 2100,
  Product: 2600,
};

const TIER_Y_SPACING: Record<string, number> = {
  Supplier: 90,
  Manufacturer: 110,
  Port: 140,
  Warehouse: 120,
  Distributor: 120,
  Product: 140,
};

export function transformToReactFlow(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedNodeId?: string | null
): { flowNodes: Node[]; flowEdges: Edge[] } {
  // Group nodes by label/type for columnar positioning
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
    const baseX = TIER_X_POSITIONS[tier] ?? 1300;
    const spacing = TIER_Y_SPACING[tier] ?? 100;
    const indexInTier = tierCounters[tier] || 0;
    tierCounters[tier] = (tierCounters[tier] || 0) + 1;

    // Slight horizontal jitter for organic aesthetic
    const jitterX = (indexInTier % 3) * 30;
    const y = 80 + indexInTier * spacing;
    const x = baseX + jitterX;

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
        animated: isConnectedToSelected || isHighRisk,
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
