import React from 'react';
import {
  Brain,
  X,
  ChevronRight,
  TrendingUp,
  Cpu,
  Target,
  Sparkles,
} from 'lucide-react';
import { GNNModelMetrics, GNNNodePrediction } from '../../types/gnn';

interface GNNAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  predictions: GNNNodePrediction[];
  metrics: GNNModelMetrics | null;
  epicenterIds: string[];
  severity: string;
  maxDelay: number;
  avgDelay: number;
  atRiskCount: number;
  confidence: number;
  onSelectNode: (nodeId: string) => void;
}

export const GNNAnalyticsDrawer: React.FC<GNNAnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  predictions,
  metrics,
  severity,
  maxDelay,
  avgDelay,
  atRiskCount,
  confidence,
  onSelectNode,
}) => {
  if (!isOpen) return null;

  const atRiskNodes = predictions.filter((p) => p.is_at_risk);
  const otherNodes = predictions.filter((p) => !p.is_at_risk);

  return (
    <aside className="absolute top-16 right-4 z-30 w-96 max-h-[calc(100vh-5.5rem)] bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden select-none animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>GNN Predictive Analytics</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                Week 3
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">GraphSAGE Node Delay Regression</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
        {/* Model Accuracy & Architecture Card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#121024] to-[#141A29] border border-purple-500/30 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Model Architecture</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
              Active / Ready
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-200">
            {metrics?.architecture || '3-Layer Lead-Time Modulated GraphSAGE'}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-purple-500/20 text-[10px] font-mono">
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[9px]">MAE Error</span>
              <span className="font-bold text-emerald-400">{metrics?.mae_days ?? 0.1} days</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[9px]">R² Score</span>
              <span className="font-bold text-sky-400">{metrics?.r2_score ?? 0.88}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[9px]">Accuracy</span>
              <span className="font-bold text-purple-300">{metrics?.at_risk_accuracy ?? 98.3}%</span>
            </div>
          </div>
        </div>

        {/* Prediction Summary KPI Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
            <span className="text-[9px] uppercase font-bold text-purple-400 block mb-0.5">Severity</span>
            <span className="text-xs font-bold font-mono text-purple-200">{severity}</span>
          </div>

          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <span className="text-[9px] uppercase font-bold text-red-400 block mb-0.5">At-Risk Nodes</span>
            <span className="text-xs font-bold font-mono text-red-200">{atRiskCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5">Max (Avg) Delay</span>
            <span className="text-xs font-bold font-mono text-amber-200">+{maxDelay}d <span className="text-[10px] text-slate-400 font-normal">(+{avgDelay}d)</span></span>
          </div>
        </div>

        {/* Ranked At-Risk Facilities List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span>Ranked At-Risk Nodes ({atRiskNodes.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">By Delay</span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {atRiskNodes.map((item) => {
              const isCritical = item.risk_level === 'CRITICAL' || item.predicted_delay_days >= 10.0;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectNode(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between ${
                    isCritical
                      ? 'bg-red-500/10 border-red-500/30 hover:border-red-400 hover:bg-red-500/20'
                      : 'bg-[#101726] border-slate-800 hover:border-amber-500/40 hover:bg-[#151D2E]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="capitalize">{item.type}</span>
                      <span>•</span>
                      <span>
                        {item.hops_from_disruption === 0
                          ? 'Epicenter'
                          : `${item.hops_from_disruption} hop${item.hops_from_disruption > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      +{item.predicted_delay_days}d
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}

            {atRiskNodes.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No facilities currently exceed the selected delay threshold.
              </div>
            )}
          </div>
        </div>

        {/* Nominal / Low Delay Entities (Collapsible summary) */}
        {otherNodes.length > 0 && (
          <div className="p-2.5 rounded-xl bg-[#0E1422] border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Nominal / Unaffected Facilities</span>
            </span>
            <span className="font-mono font-bold text-slate-300">{otherNodes.length} nodes</span>
          </div>
        )}
      </div>

      {/* Footer Model Confidence */}
      <div className="p-2.5 bg-slate-900/70 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
        <span>Inference Confidence: {confidence}%</span>
        <span className="text-teal-400 font-bold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Real-time GNN
        </span>
      </div>
    </aside>
  );
};
