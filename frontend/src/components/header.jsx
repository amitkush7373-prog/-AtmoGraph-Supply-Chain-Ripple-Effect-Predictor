export default function Header({ nodeCount, edgeCount }) {
  return (
    <header className="h-16 shrink-0 border-b border-border bg-panel/60 backdrop-blur flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-signal/10 border border-signal/30 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-signal shadow-glow" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-lg leading-none tracking-tight">
            Atmo<span className="text-signal">Graph</span>
          </h1>
          <p className="text-[11px] text-textMuted font-mono mt-0.5">
            Supply Chain Ripple Predictor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-textSecondary">
          <span>
            NODES <span className="text-textPrimary">{nodeCount.toLocaleString()}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            EDGES <span className="text-textPrimary">{edgeCount.toLocaleString()}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-risk-low/30 bg-risk-low/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
          </span>
          <span className="text-xs font-mono text-risk-low">LIVE</span>
        </div>
      </div>
    </header>
  )
}