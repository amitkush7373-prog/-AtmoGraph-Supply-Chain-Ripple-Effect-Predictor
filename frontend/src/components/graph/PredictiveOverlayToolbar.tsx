import React from 'react';
import { Brain, SlidersHorizontal, BarChart3, AlertTriangle, Sparkles } from 'lucide-react';
import { GNNModelMetrics } from '../../types/gnn';

interface PredictiveOverlayToolbarProps {
  isPredictiveMode: boolean;
  onTogglePredictiveMode: () => void;
  delayThreshold: number;
  onSelectThreshold: (threshold: number) => void;
  atRiskCount: number;
  maxDelay: number;
  metrics: GNNModelMetrics | null;
  onToggleAnalyticsDrawer: () => void;
  isAnalyticsDrawerOpen: boolean;
}

export const PredictiveOverlayToolbar: React.FC<PredictiveOverlayToolbarProps> = ({
  isPredictiveMode,
  onTogglePredictiveMode,
  delayThreshold,
  onSelectThreshold,
  atRiskCount,
  maxDelay,
  metrics,
  onToggleAnalyticsDrawer,
  isAnalyticsDrawerOpen,
}) => {
  const thresholdOptions = [
    { label: 'All Delays', value: 0 },
    { label: '≥3d Delay', value: 3 },
    { label: '≥7d Severe', value: 7 },
    { label: '≥12d Critical', value: 12 },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 select-none pointer-events-auto">
      {/* Main Glassmorphic Control Bar */}
      <div className="px-3.5 py-2 rounded-2xl bg-[#0B0F19]/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl flex items-center space-x-3 text-xs">
        {/* 1. Predictive Mode Master Switch */}
        <button
          onClick={onTogglePredictiveMode}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
            isPredictiveMode
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400/40'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
          }`}
          title="Toggle Graph Neural Network node regression overlay highlighting at-risk facilities"
        >
          <Brain className={`w-3.5 h-3.5 ${isPredictiveMode ? 'animate-pulse text-white' : 'text-purple-400'}`} />
          <span className="tracking-tight">Predictive Overlay</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isPredictiveMode ? 'bg-white animate-ping' : 'bg-slate-600'
            }`}
          />
        </button>

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-slate-800" />

        {/* 2. Delay Threshold Selector Pills (Only visible when Predictive Mode is ON) */}
        {isPredictiveMode ? (
          <div className="flex items-center space-x-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3 text-sky-400" />
              <span>Filter:</span>
            </span>

            {thresholdOptions.map((opt) => {
              const isSelected = delayThreshold === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onSelectThreshold(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Turn ON to visualize GNN downstream delay ripple</span>
          </div>
        )}

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-slate-800" />

        {/* 3. Live At-Risk Stat Badge */}
        {isPredictiveMode && atRiskCount > 0 && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-[11px] font-mono font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>{atRiskCount} Nodes At Risk</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300">Max +{maxDelay}d</span>
          </div>
        )}

        {/* 4. GNN Model Performance Pill */}
        {metrics && (
          <div className="hidden lg:flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="text-purple-400">GNN:</span>
            <span>R²: {metrics.r2_score}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">MAE: {metrics.mae_days}d</span>
          </div>
        )}

        {/* 5. GNN Analytics Drawer Button */}
        <button
          onClick={onToggleAnalyticsDrawer}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            isAnalyticsDrawerOpen
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
          title="Open GNN Model Metrics & Ranked Delay Analysis"
        >
          <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          <span>GNN Analytics</span>
        </button>
      </div>
    </div>
  );
};
