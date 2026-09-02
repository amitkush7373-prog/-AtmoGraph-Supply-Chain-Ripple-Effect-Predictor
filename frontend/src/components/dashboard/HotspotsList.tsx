import React from 'react';
import { ShieldAlert, ChevronRight, MapPin } from 'lucide-react';
import { RiskNodeItem } from '../../types/risk';
import { RiskBadge, TypeBadge } from '../common/Badge';

interface HotspotsListProps {
  nodes: RiskNodeItem[];
  onSelectNode?: (nodeId: string) => void;
  isLoading?: boolean;
}

export const HotspotsList: React.FC<HotspotsListProps> = ({
  nodes,
  onSelectNode,
  isLoading = false,
}) => {
  if (isLoading && nodes.length === 0) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded bg-dark-700/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-dark-800 border border-slate-800 overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Top Elevated Supply Chain Hotspots
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {nodes.length} Entities
        </span>
      </div>

      <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto custom-scrollbar">
        {nodes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No critical or elevated risk entities detected at this time.
          </div>
        ) : (
          nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onSelectNode?.(node.id)}
              className="p-3 hover:bg-dark-700/60 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center space-x-2 mb-1">
                  <TypeBadge type={node.type} size="sm" />
                  <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-400 transition-colors">
                    {node.name}
                  </h4>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {node.city ? `${node.city}, ` : ''}{node.country || 'Global'}
                  </span>
                  {node.industry && <span>• {node.industry}</span>}
                </div>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="text-right">
                  <RiskBadge level={node.risk} size="sm" />
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Score: {node.risk_score.toFixed(2)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
