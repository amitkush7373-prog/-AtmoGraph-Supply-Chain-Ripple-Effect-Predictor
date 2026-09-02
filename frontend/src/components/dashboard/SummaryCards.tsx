import React from 'react';
import { Network, GitFork, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import { GraphSummary } from '../../types/graph';
import { RiskSummary } from '../../types/risk';

interface SummaryCardsProps {
  graphSummary: GraphSummary | null;
  riskSummary: RiskSummary | null;
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  graphSummary,
  riskSummary,
  isLoading = false,
}) => {
  const totalNodes = graphSummary?.total_nodes || riskSummary?.total_nodes || 0;
  const totalEdges = graphSummary?.total_relationships || 0;
  const criticalCount = riskSummary?.risk_distribution.CRITICAL || 0;
  const highCount = riskSummary?.risk_distribution.HIGH || 0;
  const avgRiskScore = riskSummary?.average_risk_score ?? 0.12;

  if (isLoading && totalNodes === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-dark-800/60 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 bg-dark-900/60 border-b border-slate-800/80">
      <StatCard
        title="Supply Chain Nodes"
        value={totalNodes.toLocaleString()}
        subtitle="Across 6 functional tiers"
        icon={<Network className="w-4 h-4" />}
        variant="default"
      />

      <StatCard
        title="Active Routes"
        value={totalEdges.toLocaleString()}
        subtitle="Global logistics links"
        icon={<GitFork className="w-4 h-4" />}
        variant="default"
      />

      <StatCard
        title="Critical Disruptions"
        value={criticalCount.toLocaleString()}
        subtitle="Immediate threat state"
        icon={<ShieldAlert className="w-4 h-4" />}
        variant={criticalCount > 0 ? 'danger' : 'default'}
      />

      <StatCard
        title="Elevated Risk Nodes"
        value={highCount.toLocaleString()}
        subtitle="Requires active monitoring"
        icon={<AlertTriangle className="w-4 h-4" />}
        variant={highCount > 0 ? 'warning' : 'default'}
      />

      <StatCard
        title="Network Avg Risk"
        value={`${(avgRiskScore * 100).toFixed(1)}%`}
        subtitle={`Baseline score: ${avgRiskScore.toFixed(2)}`}
        icon={<Activity className="w-4 h-4" />}
        variant={avgRiskScore >= 0.5 ? 'warning' : 'info'}
      />
    </div>
  );
};
