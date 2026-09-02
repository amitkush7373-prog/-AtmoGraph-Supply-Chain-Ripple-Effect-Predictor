import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { GraphNode, GraphEdge, NodeDetail } from '../../types/graph';
import { CustomNode } from './CustomNode';
import { transformToReactFlow } from '../../utils/graphLayout';
import { GraphToolbar } from './GraphToolbar';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalGraphNodes?: number;
  totalGraphEdges?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedNodeId: string | null;
  selectedNodeDetail: NodeDetail | null;
  isLoadingDetail?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const FlowInner: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  totalGraphNodes,
  totalGraphEdges,
  isLoading,
  error,
  onRetry,
  selectedNodeId,
  selectedNodeDetail,
  isLoadingDetail,
  onSelectNode,
  onResetFilters,
  hasActiveFilters,
}) => {
  // Transform domain nodes to React Flow layout
  const { flowNodes, flowEdges } = useMemo(
    () => transformToReactFlow(nodes, edges, selectedNodeId),
    [nodes, edges, selectedNodeId]
  );

  const [currentNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [currentEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync internal flow state when props change
  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handlePaneClick = useCallback(() => {
    if (selectedNodeId) {
      onSelectNode(null);
    }
  }, [selectedNodeId, onSelectNode]);

  if (isLoading && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-dark-900">
        <LoadingState message="Loading global supply chain topology..." size="lg" />
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-dark-900">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-dark-900">
        <EmptyState
          title="No Supply Chain Entities Found"
          message="Try loosening the filter parameters to view other network tiers."
          actionText="Reset All Filters"
          onAction={onResetFilters}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-dark-900 overflow-hidden select-none">
      <GraphToolbar
        nodeCount={nodes.length}
        edgeCount={edges.length}
        totalGraphNodes={totalGraphNodes}
        totalGraphEdges={totalGraphEdges}
        onResetFilters={onResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E293B" gap={24} size={1} />
        <Controls
          className="!bg-dark-800 !border !border-slate-700 !rounded-lg !shadow-lg !overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const risk = (node.data?.risk || 'LOW').toUpperCase();
            if (risk === 'CRITICAL') return '#EF4444';
            if (risk === 'HIGH') return '#F97316';
            if (risk === 'MEDIUM') return '#F59E0B';
            return '#10B981';
          }}
          className="!bg-dark-800/90 !border !border-slate-700 !rounded-lg !shadow-lg !bottom-4 !left-4"
          maskColor="rgba(7, 11, 19, 0.75)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Slide-out Inspector Drawer */}
      <NodeDetailsDrawer
        nodeDetail={selectedNodeDetail}
        isLoading={isLoadingDetail}
        onClose={() => onSelectNode(null)}
        onSelectConnectedNode={(id) => onSelectNode(id)}
      />
    </div>
  );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
};
