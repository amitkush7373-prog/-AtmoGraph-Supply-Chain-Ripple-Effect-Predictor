import React from 'react';
import {
  TrendingUp,
  ArrowRight,
  GitBranch,
  Activity,
} from 'lucide-react';
import { NodeRiskUpdate } from '../../types/risk';
import { RippleEffectItem } from '../../types/news';
import { RiskBadge, TypeBadge } from '../common/Badge';

interface RiskChangesViewProps {
  riskUpdates: NodeRiskUpdate[];
  rippleEffects: RippleEffectItem[];
  onSelectNode?: (nodeId: string) => void;
}

export const RiskChangesView: React.FC<RiskChangesViewProps> = ({
  riskUpdates,
  rippleEffects,
  onSelectNode,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Primary Risk Updates Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span>Primary Disruption Risk Updates ({riskUpdates.length} nodes)</span>
        </div>

        {riskUpdates.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-dark-900/60 rounded-lg border border-slate-800">
            No primary nodes updated.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskUpdates.map((up) => {
              const scoreDelta = up.new_score - up.previous_score;
              return (
                <div
                  key={up.id}
                  onClick={() => onSelectNode?.(up.id)}
                  className="p-4 rounded-xl bg-dark-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3 group shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <TypeBadge type={up.type} size="sm" />
                      <h4 className="text-xs font-bold text-slate-100 mt-1 truncate group-hover:text-brand-400 transition-colors">
                        {up.name}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500">ID: {up.id}</span>
                    </div>

                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-dark-700 text-slate-300 border border-slate-600">
                      <Activity className="w-2.5 h-2.5 text-orange-400 mr-1" />
                      {up.status}
                    </span>
                  </div>

                  {/* Risk Shift Indicator */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900/80 border border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <RiskBadge level={up.previous_risk} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <RiskBadge level={up.new_risk} size="sm" />
                    </div>

                    <div className="text-right font-mono text-xs font-bold text-orange-400">
                      +{scoreDelta.toFixed(2)} ({up.new_score.toFixed(2)})
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    <span className="text-slate-300 font-medium">Impact: </span>
                    {up.risk_reason}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Downstream Ripple Propagation Section */}
      {rippleEffects.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>Downstream Supply Chain Ripple Effects ({rippleEffects.length} nodes)</span>
            </div>
            <span className="text-[10px] text-purple-400 font-mono">50% Cascade Attenuation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {rippleEffects.map((rp) => (
              <div
                key={`${rp.id}-${rp.parent_id}`}
                onClick={() => onSelectNode?.(rp.id)}
                className="p-3 rounded-lg bg-dark-800/80 border border-purple-500/20 hover:border-purple-500/40 hover:bg-dark-700/60 transition-all cursor-pointer space-y-2 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-1">
                  <TypeBadge type={rp.type || rp.label} size="sm" />
                  <div className="flex items-center space-x-1">
                    <RiskBadge level={rp.previous_risk} size="sm" showIcon={false} />
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <RiskBadge level={rp.new_risk} size="sm" showIcon={false} />
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                    {rp.name}
                  </h5>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Origin: <span className="text-slate-300">{rp.parent_name}</span> via{' '}
                    <span className="text-purple-400 font-mono">{rp.relationship}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800/60 truncate">
                  {rp.impact_reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
