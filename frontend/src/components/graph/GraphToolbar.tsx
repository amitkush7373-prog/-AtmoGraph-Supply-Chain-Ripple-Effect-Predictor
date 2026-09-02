import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Network } from 'lucide-react';
import { useReactFlow } from 'reactflow';

interface GraphToolbarProps {
  nodeCount: number;
  edgeCount: number;
  totalGraphNodes?: number;
  totalGraphEdges?: number;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  nodeCount,
  edgeCount,
  totalGraphNodes,
  totalGraphEdges,
  onResetFilters,
  hasActiveFilters = false,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
      {/* Node/Edge Counter Badge */}
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800/90 backdrop-blur-md border border-slate-700/80 text-xs font-medium text-slate-300 shadow-md">
        <Network className="w-4 h-4 text-brand-400" />
        <span>
          Showing <span className="text-slate-100 font-bold">{nodeCount.toLocaleString()}</span> nodes
          {' • '}
          <span className="text-slate-100 font-bold">{edgeCount.toLocaleString()}</span> routes
        </span>
        {totalGraphNodes && totalGraphNodes > nodeCount ? (
          <span className="text-[10px] text-slate-500">
            (of {totalGraphNodes.toLocaleString()} nodes{totalGraphEdges ? `, ${totalGraphEdges.toLocaleString()} routes` : ''})
          </span>
        ) : null}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center bg-dark-800/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-0.5 shadow-md">
        <button
          onClick={() => zoomIn({ duration: 250 })}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-colors"
          title="Zoom In"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut({ duration: 250 })}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-colors"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-colors"
          title="Fit View"
          aria-label="Fit graph to view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reset Filter Action */}
      {hasActiveFilters && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800/90 hover:bg-dark-700 border border-slate-700/80 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors shadow-md"
          title="Reset active filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
