import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  DollarSign,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DisruptionNewsItem } from '../news/LiveNewsFeed';
import { ExtractedEntity } from '../../types/news';

interface ImpactAnalysisPanelProps {
  activeNews: DisruptionNewsItem | null;
  extractedEntities: ExtractedEntity[];
  affectedNodeNames: string[];
  onResetSimulation: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  activeNews,
  extractedEntities,
  affectedNodeNames,
  onResetSimulation,
}) => {
  if (!activeNews) {
    return (
      <aside className="w-80 h-full bg-[#0B0F19] border-l border-slate-800/80 flex flex-col flex-shrink-0 z-10 select-none">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Impact Analysis
            </h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-xs leading-relaxed max-w-[220px]">
            Select a news event on the left to simulate ripple effect across the supply chain.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-84 h-full bg-[#0B0F19] border-l border-slate-800/80 flex flex-col flex-shrink-0 z-10 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Impact Analysis
          </h2>
        </div>

        <button
          onClick={onResetSimulation}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {/* Disrupted Primary Node */}
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              Primary Disruption Epicenter
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
              {activeNews.severity}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-100">
            {activeNews.targetNodeName || 'Supply Chain Hub'}
          </h3>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded bg-[#0B0F19]/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Delay
              </span>
              <span className="font-bold text-amber-300">+{activeNews.estDelay} days</span>
            </div>

            <div className="p-2 rounded bg-[#0B0F19]/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" /> Cost
              </span>
              <span className="font-bold text-emerald-300">{activeNews.estCost}</span>
            </div>
          </div>
        </div>

        {/* spaCy Extracted Entities */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Extracted spaCy Entities</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {extractedEntities.map((ent, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1"
              >
                <span>{ent.text}</span>
                <span className="text-[9px] uppercase font-mono text-slate-400">[{ent.label}]</span>
              </span>
            ))}
          </div>
        </div>

        {/* Cascading Ripple Hops Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span>Downstream Ripple Cascade ({activeNews.hops} Hops)</span>
          </div>

          <div className="space-y-1.5">
            {affectedNodeNames.map((name, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#101726] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 animate-ping" />
                  <span className="font-semibold text-slate-200 truncate">{name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                  Hop {Math.min(activeNews.hops, i + 1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Model Score */}
        <div className="p-3 rounded-lg bg-[#101726] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-medium text-slate-300">Model Confidence</span>
          </div>
          <span className="text-xs font-mono font-bold text-teal-400">94.2%</span>
        </div>
      </div>
    </aside>
  );
};
