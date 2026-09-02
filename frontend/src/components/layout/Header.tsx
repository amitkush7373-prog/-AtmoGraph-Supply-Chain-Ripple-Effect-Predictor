import React from 'react';
import { Network, Database, Server, RefreshCw } from 'lucide-react';
import { HealthResponse } from '../../services/api';

interface HeaderProps {
  health: HealthResponse | null;
  isApiOnline: boolean;
  isNeo4jOnline: boolean;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isApiOnline,
  isNeo4jOnline,
  onRefreshAll,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 px-5 bg-dark-800 border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-20">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-slate-100 font-mono">
              AtmoGraph
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
              v1.0 • Analyst
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Supply Chain Ripple Effect Intelligence
          </p>
        </div>
      </div>

      {/* Right Actions & Health Indicators */}
      <div className="flex items-center space-x-3">
        {/* Backend API status */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-xs text-slate-300"
          title={isApiOnline ? 'FastAPI Backend Online' : 'Backend server offline'}
        >
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`w-2 h-2 rounded-full ${
              isApiOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'
            }`}
          />
          <span className="text-[11px] font-medium hidden sm:inline">
            API {isApiOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Neo4j status */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-xs text-slate-300"
          title={isNeo4jOnline ? `Neo4j Database: ${health?.database || 'neo4j'}` : 'Neo4j Database disconnected'}
        >
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`w-2 h-2 rounded-full ${
              isNeo4jOnline
                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-medium hidden sm:inline">
            Neo4j {isNeo4jOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Refresh button */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-dark-700 hover:bg-dark-600 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Refresh graph and risk data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
};
