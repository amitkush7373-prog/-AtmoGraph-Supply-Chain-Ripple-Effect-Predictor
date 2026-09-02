import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Factory,
  Anchor,
  Warehouse,
  Truck,
  Package,
  Layers,
  MapPin,
  Activity,
} from 'lucide-react';
import { GraphNode } from '../../types/graph';
import { formatRiskColor, formatNodeTypeColor } from '../../utils/formatters';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Supplier: <Layers className="w-4 h-4 text-emerald-400" />,
  Manufacturer: <Factory className="w-4 h-4 text-blue-400" />,
  Port: <Anchor className="w-4 h-4 text-cyan-400" />,
  Warehouse: <Warehouse className="w-4 h-4 text-amber-400" />,
  Distributor: <Truck className="w-4 h-4 text-purple-400" />,
  Product: <Package className="w-4 h-4 text-rose-400" />,
};

const CustomNodeComponent: React.FC<NodeProps<GraphNode & { isSelected?: boolean }>> = ({ data, selected }) => {
  const nodeType = data.label || data.type || 'Supplier';
  const riskLevel = data.risk || 'LOW';
  const riskScore = data.risk_score ?? 0.1;

  const { nodeBorder, nodeGlow, dotColor, badgeBg, badgeText, badgeBorder } = formatRiskColor(riskLevel);
  const { iconBg } = formatNodeTypeColor(nodeType);

  const isHighOrCritical = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const isSelected = selected || data.isSelected;

  return (
    <div
      className={`relative w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border transition-all duration-200 p-3.5 shadow-2xl hover:scale-[1.02] cursor-pointer ${
        isSelected
          ? 'border-sky-400 ring-2 ring-sky-500/50 shadow-sky-500/30 shadow-2xl scale-[1.03]'
          : nodeBorder
      } ${nodeGlow}`}
    >
      {/* React Flow Left and Right Connection Points */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />

      {/* Header: Node Type Icon + Tier Title + Risk Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconBg}`}>
            {TYPE_ICONS[nodeType] || <Layers className="w-4 h-4 text-slate-300" />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              {nodeType}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block leading-tight">
              {data.id}
            </span>
          </div>
        </div>

        {/* Risk Badge Pill */}
        <span
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg} ${badgeText} ${badgeBorder} flex-shrink-0 shadow-sm`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
              isHighOrCritical ? 'animate-ping' : ''
            }`}
          />
          <span>{riskLevel}</span>
        </span>
      </div>

      {/* Main Node Name */}
      <h4
        className="text-xs font-bold text-slate-100 line-clamp-1 mb-2 tracking-tight group-hover:text-sky-300 transition-colors"
        title={data.name}
      >
        {data.name}
      </h4>

      {/* Bottom Metadata: Location & Operational Status & Risk Score */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-1 truncate max-w-[130px]">
          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="truncate font-medium text-slate-300">
            {data.city ? `${data.city}, ` : ''}{data.country || 'Global'}
          </span>
        </div>

        <div className="flex items-center space-x-1 font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
          <Activity className="w-2.5 h-2.5 text-sky-400" />
          <span>{(riskScore * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export const CustomNode = memo(CustomNodeComponent);
