import React from 'react';
import { Network, CheckCircle2, MapPin } from 'lucide-react';
import { MatchedNode } from '../../types/news';
import { TypeBadge } from '../common/Badge';

interface MatchedNodesViewProps {
  matchedNodes: MatchedNode[];
  onSelectNode?: (nodeId: string) => void;
}

export const MatchedNodesView: React.FC<MatchedNodesViewProps> = ({
  matchedNodes,
  onSelectNode,
}) => {
  if (matchedNodes.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 bg-dark-900/60 rounded-lg border border-slate-800">
        No direct supply chain nodes matched in the Neo4j graph.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
        <div className="flex items-center space-x-2">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>Matched Neo4j Entities ({matchedNodes.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {matchedNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onSelectNode?.(node.id)}
            className="p-3 rounded-lg bg-dark-800 border border-slate-800 hover:border-slate-700 hover:bg-dark-700/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <TypeBadge type={node.type || node.label} size="sm" />
              <span className="inline-flex items-center text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                {(node.confidence * 100).toFixed(0)}% {node.match_type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-400 transition-colors">
                {node.name}
              </h4>
              <div className="flex items-center text-[10px] text-slate-400 mt-1">
                <MapPin className="w-3 h-3 text-slate-500 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {node.city ? `${node.city}, ` : ''}{node.country || 'Global'}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between">
              <span>ID: {node.id}</span>
              <span className="text-brand-400 group-hover:underline">View in Graph →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
