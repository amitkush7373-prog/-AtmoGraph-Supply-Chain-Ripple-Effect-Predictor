import React from 'react';
import { Network, Database, Brain, Sparkles, RefreshCw, Activity } from 'lucide-react';

interface HeaderProps {
  health?: any;
  isApiOnline: boolean;
  isNeo4jOnline: boolean;
  onRefreshAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isApiOnline,
  isNeo4jOnline,
  onRefreshAll,
}) => {
  return (
    <header className="h-14 bg-[#0B0F19] border-b border-slate-800/80 px-5 flex items-center justify-between flex-shrink-0 z-30 select-none">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Network className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">AtmoGraph</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              V1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Supply Chain Ripple Effect Predictor</p>
        </div>
      </div>

      {/* Tech Badges & Status */}
      <div className="flex items-center space-x-4 text-xs font-medium">
        <div className="hidden md:flex items-center space-x-3 text-slate-400 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Brain className="w-3 h-3 text-purple-400" />
            <span className="text-slate-500">GNN Model:</span> PyG-GraphSAGE
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="text-slate-500">NLP:</span> spaCy v3.8
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-500">FastAPI:</span>
            <span className={isApiOnline ? 'text-emerald-400' : 'text-rose-400'}>
              {isApiOnline ? 'Online' : 'Offline'}
            </span>
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-500">Neo4j:</span>
            <span className={isNeo4jOnline ? 'text-emerald-400' : 'text-amber-400'}>
              {isNeo4jOnline ? 'Live DB' : 'Graph Dataset'}
            </span>
          </span>
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefreshAll}
          title="Refresh Graph & Risk State"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer text-xs"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};
