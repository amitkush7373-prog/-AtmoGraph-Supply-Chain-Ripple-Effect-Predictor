import React from 'react';
import {
  X,
  MapPin,
  Building2,
  Activity,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';
import { NodeDetail } from '../../types/graph';
import { RiskBadge, TypeBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { LoadingState } from '../common/LoadingState';

interface NodeDetailsDrawerProps {
  nodeDetail: NodeDetail | null;
  isLoading?: boolean;
  onClose: () => void;
  onSelectConnectedNode?: (nodeId: string) => void;
}

export const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({
  nodeDetail,
  isLoading = false,
  onClose,
  onSelectConnectedNode,
}) => {
  if (!nodeDetail && !isLoading) return null;

  return (
    <aside
      className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-dark-800/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200"
      aria-label="Node Details Panel"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-dark-700/40">
        <div className="flex items-center space-x-2 min-w-0">
          <TypeBadge type={nodeDetail?.label || nodeDetail?.type || 'Entity'} size="sm" />
          <span className="font-mono text-xs text-slate-400">ID: {nodeDetail?.id}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-600 transition-colors"
          title="Close details"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Fetching node topology..." />
        </div>
      ) : nodeDetail ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {/* Node Title & Risk Banner */}
          <div>
            <h3 className="text-base font-bold text-slate-100 leading-snug mb-2">
              {nodeDetail.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={nodeDetail.risk} size="md" />
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-dark-700 text-slate-300 border border-slate-600">
                <Activity className="w-3 h-3 text-brand-400 mr-1" />
                {nodeDetail.status || 'OPERATIONAL'}
              </span>
            </div>
          </div>

          {/* Risk Metrics Card */}
          <div className="p-3.5 rounded-lg bg-dark-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Risk Score
              </span>
              <span className="font-mono font-bold text-slate-100">
                {(nodeDetail.risk_score * 100).toFixed(1)}% ({nodeDetail.risk_score.toFixed(2)})
              </span>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-dark-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  nodeDetail.risk === 'CRITICAL'
                    ? 'bg-red-500'
                    : nodeDetail.risk === 'HIGH'
                    ? 'bg-orange-500'
                    : nodeDetail.risk === 'MEDIUM'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, nodeDetail.risk_score * 100))}%` }}
              />
            </div>

            {nodeDetail.risk_reason && (
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                <span className="text-slate-300 font-medium">Risk Assessment: </span>
                {nodeDetail.risk_reason}
              </p>
            )}

            {nodeDetail.updated_at && (
              <div className="flex items-center text-[10px] text-slate-500 pt-1">
                <Clock className="w-3 h-3 mr-1" />
                Updated: {formatDate(nodeDetail.updated_at)}
              </div>
            )}
          </div>

          {/* Location & Industry Metadata */}
          <div className="space-y-2 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Entity Information
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-md bg-dark-700/50 border border-slate-800">
                <div className="flex items-center text-slate-400 text-[10px] mb-1">
                  <MapPin className="w-3 h-3 mr-1 text-slate-500" /> Location
                </div>
                <div className="font-semibold text-slate-200 truncate">
                  {nodeDetail.city ? `${nodeDetail.city}, ` : ''}{nodeDetail.country || 'Global'}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-dark-700/50 border border-slate-800">
                <div className="flex items-center text-slate-400 text-[10px] mb-1">
                  <Building2 className="w-3 h-3 mr-1 text-slate-500" /> Industry
                </div>
                <div className="font-semibold text-slate-200 truncate">
                  {nodeDetail.industry || 'General Logistics'}
                </div>
              </div>
            </div>
          </div>

          {/* Outgoing Routes (Supplies To / Ships To) */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-brand-400" />
                Outgoing Routes ({nodeDetail.outgoing_connections?.length || 0})
              </h4>
            </div>

            {nodeDetail.outgoing_connections && nodeDetail.outgoing_connections.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {nodeDetail.outgoing_connections.map((conn) => (
                  <div
                    key={`${conn.id}-${conn.relationship}`}
                    onClick={() => onSelectConnectedNode?.(conn.id)}
                    className="flex items-center justify-between p-2 rounded-md bg-dark-700/40 hover:bg-dark-600/60 border border-slate-800 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-400 transition-colors">
                        {conn.name}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono text-brand-400">{conn.relationship}</span>
                        {conn.lead_time_days ? <span>• {conn.lead_time_days}d lead</span> : null}
                      </div>
                    </div>
                    {conn.risk && <RiskBadge level={conn.risk} size="sm" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic p-2 bg-dark-700/20 rounded">
                No direct outgoing connections recorded.
              </p>
            )}
          </div>

          {/* Incoming Routes */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-purple-400" />
                Incoming Routes ({nodeDetail.incoming_connections?.length || 0})
              </h4>
            </div>

            {nodeDetail.incoming_connections && nodeDetail.incoming_connections.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {nodeDetail.incoming_connections.map((conn) => (
                  <div
                    key={`${conn.id}-${conn.relationship}`}
                    onClick={() => onSelectConnectedNode?.(conn.id)}
                    className="flex items-center justify-between p-2 rounded-md bg-dark-700/40 hover:bg-dark-600/60 border border-slate-800 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                        {conn.name}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono text-purple-400">{conn.relationship}</span>
                        {conn.lead_time_days ? <span>• {conn.lead_time_days}d lead</span> : null}
                      </div>
                    </div>
                    {conn.risk && <RiskBadge level={conn.risk} size="sm" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic p-2 bg-dark-700/20 rounded">
                No direct incoming connections recorded.
              </p>
            )}
          </div>

          {/* Disruption Events History */}
          {nodeDetail.recent_disruptions && nodeDetail.recent_disruptions.length > 0 && (
            <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                Attached Disruption Events
              </h4>
              <div className="space-y-1.5">
                {nodeDetail.recent_disruptions.map((d) => (
                  <div
                    key={d.id}
                    className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-300 truncate">{d.title || d.id}</span>
                      <RiskBadge level={d.severity} size="sm" />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Impact Delta: +{(d.risk_delta || 0.35).toFixed(2)}</span>
                      <span>{formatDate(d.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
};
