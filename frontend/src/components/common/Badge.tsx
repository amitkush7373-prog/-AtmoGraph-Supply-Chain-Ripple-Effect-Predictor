import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { formatRiskColor, formatNodeTypeColor } from '../../utils/formatters';

interface RiskBadgeProps {
  level?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level = 'LOW', size = 'md', showIcon = true }) => {
  const { badgeBg, badgeText, badgeBorder } = formatRiskColor(level);

  const getIcon = () => {
    const l = level.toUpperCase();
    if (l === 'CRITICAL') return <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-400" />;
    if (l === 'HIGH') return <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-400" />;
    if (l === 'MEDIUM') return <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />;
    return <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />;
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-semibold',
    md: 'text-xs px-2 py-0.5 font-semibold',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded border ${badgeBg} ${badgeText} ${badgeBorder} ${sizeClasses[size]}`}
    >
      {showIcon && getIcon()}
      {level.toUpperCase()}
    </span>
  );
};

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'md' }) => {
  const { bg, text, border } = formatNodeTypeColor(type);
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded border font-medium ${bg} ${text} ${border} ${sizeClasses}`}>
      {type}
    </span>
  );
};
