import React from 'react';
import {
  LayoutDashboard,
  Network,
  Radio,
  Cpu,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'graph' | 'analysis' | 'predictive';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  criticalCount?: number;
  highCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  criticalCount = 0,
  highCount = 0,
}) => {
  return (
    <aside className="w-64 bg-dark-800 border-r border-slate-800 flex flex-col flex-shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('graph')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'graph'
              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Network className="w-4 h-4" />
            <span>Supply Chain Graph</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange('analysis')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'analysis'
              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-orange-400" />
            <span>Disruption Analysis</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
            NLP
          </span>
        </button>

        {/* Week 3 Feature: Active Predictive Ripple GNN */}
        <button
          onClick={() => onTabChange('predictive')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all mt-1 cursor-pointer ${
            activeTab === 'predictive'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
          }`}
          title="Graph Neural Network (GNN) Delay Regression & Predictive Ripple Intelligence"
        >
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Predictive Ripple (GNN)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono">
            Active
          </span>
        </button>
      </div>

      {/* Threat Summary Box */}
      <div className="p-3 mx-3 mt-4 rounded-lg bg-dark-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Active Threats
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
            <div className="text-[10px] uppercase font-bold text-red-400">Critical</div>
            <div className="text-base font-bold font-mono text-red-300">{criticalCount}</div>
          </div>
          <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
            <div className="text-[10px] uppercase font-bold text-orange-400">High</div>
            <div className="text-base font-bold font-mono text-orange-300">{highCount}</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Mid-Review Build
        </span>
        <span className="font-mono">Neo4j + spaCy</span>
      </div>
    </aside>
  );
};
