import React from 'react';
import { Newspaper, Zap, Sparkles } from 'lucide-react';

export interface DisruptionNewsItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  source: string;
  timeAgo: string;
  headline: string;
  snippet: string;
  tags: string[];
  targetNodeId?: string;
  targetNodeName?: string;
  rawText: string;
  rippleNodesCount: number;
  estDelay: number;
  estCost: string;
  hops: number;
}

export const LIVE_NEWS_PRESETS: DisruptionNewsItem[] = [
  {
    id: 'news_rotterdam',
    severity: 'CRITICAL',
    source: 'Reuters',
    timeAgo: '2 min ago',
    headline: 'Major port strike halts operations at Port of Rotterdam',
    snippet: "Dock workers at Europe's largest port have walked out indefinitely, halting all container terminal operations...",
    tags: ['Europe', 'Electronics', 'Automotive'],
    targetNodeId: 'PRT_0001',
    targetNodeName: 'Port of Rotterdam',
    rawText: "Due to a major port strike in Rotterdam, shipments from European electronics suppliers are experiencing severe delays and container vessel backlogs across the Netherlands.",
    rippleNodesCount: 14,
    estDelay: 14,
    estCost: '$4.2M',
    hops: 3,
  },
  {
    id: 'news_taiwan',
    severity: 'HIGH',
    source: 'Bloomberg',
    timeAgo: '1 hr ago',
    headline: 'Taiwan semiconductor fab reports production disruption',
    snippet: 'A major TSMC facility experienced a power outage affecting wafer production for automotive and consumer electronics...',
    tags: ['Asia', 'Electronics'],
    targetNodeId: 'MAN_01453',
    targetNodeName: 'Wafers (Taiwan)',
    rawText: "Taiwan semiconductor fab halts 300mm wafer fabrication due to sudden power outage in Hsinchu Science Park, impacting global chip deliveries.",
    rippleNodesCount: 11,
    estDelay: 21,
    estCost: '$6.8M',
    hops: 4,
  },
  {
    id: 'news_suez',
    severity: 'HIGH',
    source: 'AP News',
    timeAgo: '10 hr ago',
    headline: 'Suez Canal traffic restricted due to vessel grounding',
    snippet: 'A large container vessel has grounded in the Suez Canal, restricting passage for Asia-to-Europe maritime trade...',
    tags: ['M. East', 'Multi'],
    targetNodeId: 'HUB_SUEZ',
    targetNodeName: 'Suez Canal',
    rawText: "A 400-meter container vessel ran aground in the Suez Canal, creating an immediate maritime bottleneck between Mediterranean and Red Sea routes.",
    rippleNodesCount: 18,
    estDelay: 12,
    estCost: '$9.5M',
    hops: 3,
  },
  {
    id: 'news_congo',
    severity: 'MEDIUM',
    source: 'Financial Times',
    timeAgo: '18 hr ago',
    headline: 'Cobalt prices surge amid Congo export restrictions',
    snippet: 'New government regulations in DRC restrict cobalt exports, sending prices up sharply and impacting EV battery supply...',
    tags: ['Africa', 'Electronics'],
    targetNodeId: 'RAW_COBALT',
    targetNodeName: 'Cobalt (Congo)',
    rawText: "Democratic Republic of Congo institutes new mining quota quotas on refined cobalt, slowing export logistics to battery cell manufacturers.",
    rippleNodesCount: 8,
    estDelay: 9,
    estCost: '$2.1M',
    hops: 2,
  },
  {
    id: 'news_shanghai',
    severity: 'MEDIUM',
    source: 'Nikkei Asia',
    timeAgo: '2 days ago',
    headline: 'Port of Shanghai congestion reaches 3-week high',
    snippet: 'Typhoon warnings and customs processing delays have led to significant container backlogs at Shanghai deepwater port...',
    tags: ['Asia', 'Shipping'],
    targetNodeId: 'PRT_0004',
    targetNodeName: 'Port of Shanghai',
    rawText: "Severe typhoon alert near Shanghai forces temporary closure of deep-water container berths, causing vessel backlogs across the East China Sea.",
    rippleNodesCount: 12,
    estDelay: 8,
    estCost: '$3.5M',
    hops: 2,
  },
];

interface LiveNewsFeedProps {
  selectedNewsId: string | null;
  onSimulateNews: (news: DisruptionNewsItem) => void;
  isSimulating?: boolean;
}

export const LiveNewsFeed: React.FC<LiveNewsFeedProps> = ({
  selectedNewsId,
  onSimulateNews,
  isSimulating = false,
}) => {
  return (
    <aside className="w-80 h-full bg-[#0B0F19] border-r border-slate-800/80 flex flex-col flex-shrink-0 z-10 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-4 h-4 text-slate-300" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live News Feed
          </h2>
        </div>
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Streaming</span>
        </span>
      </div>

      {/* News Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {LIVE_NEWS_PRESETS.map((item) => {
          const isSelected = selectedNewsId === item.id;
          const severityColors = {
            CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
            HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
            MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          };

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all duration-200 space-y-2.5 ${
                isSelected
                  ? 'bg-[#151D2E] border-sky-500 shadow-lg shadow-sky-500/10'
                  : 'bg-[#101726] border-slate-800/90 hover:border-slate-700 hover:bg-[#121A2B]'
              }`}
            >
              {/* Meta: Severity • Source • Time */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className={`px-1.5 py-0.5 rounded border ${severityColors[item.severity]}`}>
                    {item.severity}
                  </span>
                  <span className="text-slate-400">• {item.source}</span>
                </div>
                <span className="text-slate-500 font-mono">{item.timeAgo}</span>
              </div>

              {/* Headline */}
              <h3 className="text-xs font-bold text-slate-100 leading-snug tracking-tight">
                {item.headline}
              </h3>

              {/* Snippet */}
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {item.snippet}
              </p>

              {/* Tags & Simulate Action */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onSimulateNews(item)}
                  disabled={isSimulating}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{isSelected ? 'Simulating' : 'Simulate'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#090D15] border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-center space-x-1.5 font-medium">
        <Sparkles className="w-3 h-3 text-sky-400" />
        <span>NLP engine ingesting from 47 feeds</span>
      </div>
    </aside>
  );
};
