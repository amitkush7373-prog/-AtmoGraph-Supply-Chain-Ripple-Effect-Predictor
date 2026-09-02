import React, { useEffect, useState } from 'react';
import {
  Radio,
  History,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { NewsAnalysisForm } from '../components/news/NewsAnalysisForm';
import { ExtractedEntitiesView } from '../components/news/ExtractedEntitiesView';
import { MatchedNodesView } from '../components/news/MatchedNodesView';
import { RiskChangesView } from '../components/news/RiskChangesView';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';
import { api } from '../services/api';
import { DisruptionEventDetail } from '../types/news';
import { RiskBadge } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

interface AnalysisProps {
  onSelectNodeInGraph?: (nodeId: string) => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ onSelectNodeInGraph }) => {
  const {
    text,
    setText,
    isAnalyzing,
    analysisResult,
    error,
    analyze,
    loadPreset,
    clearResult,
    presets,
  } = useNewsAnalysis();

  const [historicalEvents, setHistoricalEvents] = useState<DisruptionEventDetail[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await api.getNewsEvents(10);
        setHistoricalEvents(res.events || []);
      } catch {
        // Quiet fallback if events endpoint is empty
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [analysisResult]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-dark-900 p-6 space-y-6 custom-scrollbar">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Disruption Intelligence & NLP Ingestion
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Process unstructured news, detect supply chain entities via spaCy NER, and propagate risk shifts through Neo4j
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Input Form & Detailed Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* News Ingestion Form */}
          <NewsAnalysisForm
            text={text}
            onTextChange={setText}
            onSubmit={() => analyze()}
            isAnalyzing={isAnalyzing}
            error={error}
            presets={presets}
            onLoadPreset={loadPreset}
            onClear={clearResult}
          />

          {/* Analysis Results View */}
          {analysisResult && (
            <div className="rounded-xl bg-dark-800 border border-slate-800 p-5 space-y-6 shadow-xl animate-in fade-in duration-300">
              {/* Disruption Severity Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-dark-800 to-dark-800 border border-orange-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Disruption Severity
                      </span>
                      <RiskBadge level={analysisResult.severity} size="md" />
                    </div>
                    <div className="text-sm font-bold text-slate-100 mt-0.5">
                      Confidence: {(analysisResult.severity_score * 100).toFixed(0)}% • Impact Bump: +{(analysisResult.severity_score * 0.5).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  {analysisResult.disruption_event_id && (
                    <div className="text-slate-300 font-semibold">
                      Event: {analysisResult.disruption_event_id}
                    </div>
                  )}
                  <div>{formatDate(analysisResult.timestamp)}</div>
                </div>
              </div>

              {/* Matched Keywords */}
              {analysisResult.matched_keywords && analysisResult.matched_keywords.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-medium">Trigger Keywords:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-dark-700 border border-slate-700 text-[11px] font-mono text-orange-300 font-semibold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Extracted Entities */}
              <ExtractedEntitiesView entities={analysisResult.entities} />

              {/* 2. Matched Neo4j Nodes */}
              <MatchedNodesView
                matchedNodes={analysisResult.matched_nodes}
                onSelectNode={onSelectNodeInGraph}
              />

              {/* 3. Risk State Updates & Ripple Propagation */}
              <RiskChangesView
                riskUpdates={analysisResult.risk_updates}
                rippleEffects={analysisResult.ripple_effects}
                onSelectNode={onSelectNodeInGraph}
              />
            </div>
          )}
        </div>

        {/* Right 1 Column: Historical Disruption Events Log */}
        <div className="space-y-4">
          <div className="rounded-xl bg-dark-800 border border-slate-800 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <History className="w-4 h-4 text-brand-400" />
                <span>Recent Graph Disruptions</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {historicalEvents.length} Events
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Loading history...
              </div>
            ) : historicalEvents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No disruption events logged in the database yet. Run an analysis above to record the first event!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {historicalEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-dark-900 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-slate-200 line-clamp-1">
                        {evt.title || evt.id}
                      </span>
                      <RiskBadge level={evt.severity} size="sm" />
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      "{evt.text}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {evt.affected_nodes_count} entities affected
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(evt.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
