import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface CircularNodeData {
  id: string;
  name: string;
  category: 'raw' | 'component' | 'manufacturer' | 'port' | 'warehouse' | 'retailer' | 'consumer';
  country?: string;
  isDisrupted?: boolean;
  isRippleAffected?: boolean;
  isSelected?: boolean;
  // Week 3 GNN Predictive Overlay Props
  isPredictiveMode?: boolean;
  isAtRisk?: boolean;
  predictedDelayDays?: number;
  predictedRiskScore?: number;
  riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; glow: string; dot: string }> = {
  raw: {
    bg: 'bg-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    dot: '#3B82F6',
  },
  component: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-300',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    dot: '#06B6D4',
  },
  manufacturer: {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    dot: '#F59E0B',
  },
  port: {
    bg: 'bg-pink-500',
    border: 'border-pink-300',
    glow: 'shadow-[0_0_18px_rgba(236,72,153,0.6)]',
    dot: '#EC4899',
  },
  warehouse: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-300',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    dot: '#10B981',
  },
  retailer: {
    bg: 'bg-purple-600',
    border: 'border-purple-400',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]',
    dot: '#8B5CF6',
  },
  consumer: {
    bg: 'bg-orange-500',
    border: 'border-orange-300',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
    dot: '#F97316',
  },
};

const CircularNodeComponent: React.FC<NodeProps<CircularNodeData>> = ({ data }) => {
  const config = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.raw;

  const isPredictive = Boolean(data.isPredictiveMode);
  const isAtRisk = Boolean(data.isAtRisk);
  const isDisrupted = Boolean(data.isDisrupted);
  const isRipple = Boolean(data.isRippleAffected);
  const delayDays = data.predictedDelayDays;
  const isCriticalRisk = data.riskLevel === 'CRITICAL' || (delayDays !== undefined && delayDays >= 10.0);

  // In Predictive Overlay mode, dim non-at-risk nodes so the critical delay ripple path shines
  const shouldDim = isPredictive && !isAtRisk && !isDisrupted && !isRipple;

  return (
    <div
      className={`flex flex-col items-center group cursor-pointer select-none transition-all duration-300 ${
        shouldDim ? 'opacity-35 hover:opacity-100' : 'opacity-100'
      }`}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none"
      />

      {/* Predictive Overlay Floating Delay Badge */}
      {isPredictive && isAtRisk && delayDays !== undefined && (
        <div className="absolute -top-7 z-30 flex items-center pointer-events-none">
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight flex items-center space-x-1 shadow-2xl backdrop-blur-md border ${
              isCriticalRisk
                ? 'bg-red-600/95 border-red-300 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse'
                : 'bg-amber-500/95 border-amber-200 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
            }`}
          >
            <span>{isCriticalRisk ? '⚠️' : '⏱️'}</span>
            <span>+{delayDays}d</span>
          </div>
        </div>
      )}

      {/* Circular Glowing Disc */}
      <div className="relative flex items-center justify-center">
        {/* Animated Shockwave rings when At-Risk in GNN Predictive Mode */}
        {isPredictive && isAtRisk && (
          <>
            <div className="absolute w-14 h-14 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
            <div className="absolute w-11 h-11 rounded-full bg-red-500/50 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Standard Disrupted State Shockwaves (if not in predictive mode) */}
        {!isPredictive && isDisrupted && (
          <>
            <div className="absolute w-12 h-12 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
            <div className="absolute w-10 h-10 rounded-full bg-red-500/50 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Standard Ripple Ring */}
        {!isPredictive && isRipple && !isDisrupted && (
          <div className="absolute w-9 h-9 rounded-full bg-orange-500/40 animate-ping pointer-events-none" />
        )}

        {/* Core Circular Node */}
        <div
          className={`w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            isPredictive && isAtRisk
              ? 'bg-red-600 border-red-300 shadow-[0_0_24px_rgba(239,68,68,0.95)] scale-125 ring-2 ring-red-400/50'
              : isPredictive && data.riskLevel === 'MEDIUM'
              ? 'bg-amber-500 border-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.8)] scale-110'
              : isDisrupted
              ? 'bg-red-600 border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.9)] scale-125'
              : isRipple
              ? 'bg-orange-500 border-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.8)] scale-110'
              : `${config.bg} ${config.border} ${config.glow} hover:scale-125`
          }`}
        />
      </div>

      {/* Node Label Below */}
      <div className="mt-1.5 text-center pointer-events-none max-w-[140px]">
        <span
          className={`text-[11px] font-semibold tracking-tight block truncate px-1.5 py-0.5 rounded transition-all ${
            isPredictive && isAtRisk
              ? 'text-red-200 font-bold bg-red-950/90 border border-red-800/80 shadow-md'
              : isPredictive && data.riskLevel === 'MEDIUM'
              ? 'text-amber-200 font-bold bg-amber-950/90 border border-amber-800/80'
              : isDisrupted
              ? 'text-red-300 font-bold bg-red-950/80'
              : isRipple
              ? 'text-orange-300 font-bold bg-orange-950/80'
              : 'text-slate-200 group-hover:text-white'
          }`}
        >
          {data.name}
        </span>
      </div>
    </div>
  );
};

export const CircularNode = memo(CircularNodeComponent);
