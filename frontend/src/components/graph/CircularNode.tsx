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

  const isDisrupted = Boolean(data.isDisrupted);
  const isRipple = Boolean(data.isRippleAffected);

  return (
    <div className="flex flex-col items-center group cursor-pointer select-none">
      {/* Target/Source Connection Handles */}
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

      {/* Circular Glowing Disc */}
      <div className="relative flex items-center justify-center">
        {/* Animated Shockwave rings if disrupted */}
        {isDisrupted && (
          <>
            <div className="absolute w-12 h-12 rounded-full bg-red-500/30 animate-ping" />
            <div className="absolute w-10 h-10 rounded-full bg-red-500/50 animate-pulse" />
          </>
        )}

        {isRipple && !isDisrupted && (
          <div className="absolute w-9 h-9 rounded-full bg-orange-500/40 animate-ping" />
        )}

        {/* Core Circular Node */}
        <div
          className={`w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            isDisrupted
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
          className={`text-[11px] font-semibold tracking-tight block truncate px-1 rounded transition-colors ${
            isDisrupted
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
