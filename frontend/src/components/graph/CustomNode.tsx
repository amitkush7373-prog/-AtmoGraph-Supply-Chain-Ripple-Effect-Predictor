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
} from 'lucide-react';
import { GraphNode } from '../../types/graph';
import { formatRiskColor, formatNodeTypeColor } from '../../utils/formatters';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Supplier: <Layers className="w-3.5 h-3.5" />,
  Manufacturer: <Factory className="w-3.5 h-3.5" />,
  Port: <Anchor className="w-3.5 h-3.5" />,
  Warehouse: <Warehouse className="w-3.5 h-3.5" />,
  Distributor: <Truck className="w-3.5 h-3.5" />,
  Product: <Package className="w-3.5 h-3.5" />,
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
      className={`relative w-56 rounded-lg bg-dark-800/95 backdrop-blur-sm border transition-all duration-150 p-3 shadow-lg ${
        isSelected
          ? 'border-brand-400 ring-2 ring-brand-500/40 shadow-brand-500/20 shadow-xl'
          : nodeBorder
      } ${nodeGlow}`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-500 !border-dark-800 hover:!bg-brand-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-500 !border-dark-800 hover:!bg-brand-400"
      />

      {/* Top Header: Node Type & Risk Badge */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className={`p-1 rounded flex-shrink-0 ${iconBg}`}>
            {TYPE_ICONS[nodeType] || <Layers className="w-3.5 h-3.5" />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {nodeType}
          </span>
        </div>

        {/* Risk Badge */}
        <span
          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeBg} ${badgeText} ${badgeBorder}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
              isHighOrCritical ? 'animate-ping' : ''
            }`}
          />
          <span>{riskLevel}</span>
        </span>
      </div>

      {/* Node Name */}
      <h4
        className="text-xs font-semibold text-slate-100 truncate mb-1"
        title={data.name}
      >
        {data.name}
      </h4>

      {/* Bottom Metadata: City / Country & Risk Score */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
        <div className="flex items-center space-x-1 truncate max-w-[120px]">
          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="truncate">{data.city || data.country || 'Global'}</span>
        </div>
        <div className="font-mono text-slate-400">
          Score: <span className="text-slate-200 font-semibold">{riskScore.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export const CustomNode = memo(CustomNodeComponent);
