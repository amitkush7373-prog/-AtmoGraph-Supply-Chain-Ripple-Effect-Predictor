import React from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { SampleDisruptionPreset } from '../../hooks/useNewsAnalysis';

interface NewsAnalysisFormProps {
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
  error: string | null;
  presets: SampleDisruptionPreset[];
  onLoadPreset: (preset: SampleDisruptionPreset) => void;
  onClear: () => void;
}

export const NewsAnalysisForm: React.FC<NewsAnalysisFormProps> = ({
  text,
  onTextChange,
  onSubmit,
  isAnalyzing,
  error,
  presets,
  onLoadPreset,
  onClear,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="rounded-xl bg-dark-800 border border-slate-800 p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Disruption & News Intelligence Ingestion
            </h3>
            <p className="text-xs text-slate-400">
              Run real-time spaCy Named Entity Recognition and propagate risk updates across Neo4j
            </p>
          </div>
        </div>

        {text && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Preset Scenario Quick-Loader Chips */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          Quick-Load Verified Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const isSelected = text === p.text;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onLoadPreset(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-dark-700/60 border-slate-700 text-slate-300 hover:bg-dark-600 hover:text-slate-100'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={4}
            placeholder="Paste disruption alert, breaking news snippet, port advisory, or logistical incident..."
            className="w-full px-3.5 py-3 rounded-lg bg-dark-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-brand-500 transition-colors resize-none font-sans"
            disabled={isAnalyzing}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <FileText className="w-3.5 h-3.5" />
            {text.length} characters • spaCy NER enabled
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || text.trim().length < 5}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running NLP Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Analyze Disruption</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
