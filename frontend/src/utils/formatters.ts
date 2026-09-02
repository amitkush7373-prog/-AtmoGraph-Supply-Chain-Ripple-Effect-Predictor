
export function formatRiskColor(risk?: string): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  nodeBorder: string;
  nodeGlow: string;
  dotColor: string;
} {
  const r = (risk || 'LOW').toUpperCase();
  switch (r) {
    case 'CRITICAL':
      return {
        badgeBg: 'bg-red-500/10',
        badgeText: 'text-red-400',
        badgeBorder: 'border-red-500/30',
        nodeBorder: 'border-red-500',
        nodeGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
        dotColor: 'bg-red-500',
      };
    case 'HIGH':
      return {
        badgeBg: 'bg-orange-500/10',
        badgeText: 'text-orange-400',
        badgeBorder: 'border-orange-500/30',
        nodeBorder: 'border-orange-500',
        nodeGlow: 'shadow-[0_0_12px_rgba(249,115,22,0.35)]',
        dotColor: 'bg-orange-500',
      };
    case 'MEDIUM':
      return {
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
        nodeBorder: 'border-amber-500/80',
        nodeGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.25)]',
        dotColor: 'bg-amber-400',
      };
    case 'LOW':
    default:
      return {
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/30',
        nodeBorder: 'border-slate-700 hover:border-slate-500',
        nodeGlow: '',
        dotColor: 'bg-emerald-400',
      };
  }
}

export function formatNodeTypeColor(type?: string): {
  bg: string;
  text: string;
  border: string;
  iconBg: string;
} {
  const t = (type || 'Supplier').toLowerCase();
  if (t.includes('supplier')) {
    return {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
    };
  } else if (t.includes('manufacturer')) {
    return {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
    };
  } else if (t.includes('port')) {
    return {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
    };
  } else if (t.includes('warehouse')) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    };
  } else if (t.includes('distributor')) {
    return {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
    };
  } else if (t.includes('product')) {
    return {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20 text-rose-400',
    };
  }
  return {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    iconBg: 'bg-slate-500/20 text-slate-400',
  };
}

export function formatDate(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
