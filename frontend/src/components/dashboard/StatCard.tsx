import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'danger' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-dark-800/90 text-slate-100',
    danger: 'border-red-500/30 bg-red-500/10 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    warning: 'border-orange-500/30 bg-orange-500/10 text-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.1)]',
    info: 'border-brand-500/30 bg-brand-500/10 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
  };

  const iconColors = {
    default: 'bg-dark-700 text-slate-300',
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-orange-500/20 text-orange-400',
    info: 'bg-brand-500/20 text-brand-400',
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg ${iconColors[variant]}`}>{icon}</div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
        {trend && <span className="text-xs font-semibold text-slate-400">{trend}</span>}
      </div>

      {subtitle && <p className="text-[11px] text-slate-500 mt-1 truncate">{subtitle}</p>}
    </div>
  );
};
