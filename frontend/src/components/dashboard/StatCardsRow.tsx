import React from 'react';
import { Link2, BarChart2, Clock, DollarSign, ShieldCheck } from 'lucide-react';

interface SimulationMetrics {
  nodesAffected: number | null;
  maxRippleHops: number | null;
  estDelayDays: number | null;
  estCostImpact: string | null;
  confidencePercent: number | null;
}

interface StatCardsRowProps {
  metrics: SimulationMetrics;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  metrics,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-5 py-3 bg-[#0B0F19] border-b border-slate-800/80 flex-shrink-0">
      {/* 1. Nodes Affected */}
      <div className="p-3.5 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold mb-1">
            <Link2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Nodes Affected</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.nodesAffected !== null ? `${metrics.nodesAffected} nodes` : '—'}
          </div>
        </div>
      </div>

      {/* 2. Max Ripple Hops */}
      <div className="p-3.5 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Max Ripple Hops</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.maxRippleHops !== null ? `${metrics.maxRippleHops} hops` : '—'}
          </div>
        </div>
      </div>

      {/* 3. Est. Delay */}
      <div className="p-3.5 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Est. Delay</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {metrics.estDelayDays !== null ? `+${metrics.estDelayDays} days` : '—'}
          </div>
        </div>
      </div>

      {/* 4. Est. Cost Impact */}
      <div className="p-3.5 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Est. Cost Impact</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {metrics.estCostImpact !== null ? metrics.estCostImpact : '—'}
          </div>
        </div>
      </div>

      {/* 5. Confidence */}
      <div className="p-3.5 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Confidence</span>
          </div>
          <div className="text-xl font-bold font-mono text-teal-400">
            {metrics.confidencePercent !== null ? `${metrics.confidencePercent}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
