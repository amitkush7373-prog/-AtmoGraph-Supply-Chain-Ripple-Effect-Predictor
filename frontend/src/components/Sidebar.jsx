const NODE_TYPE_META = {
  Supplier: { color: '#3FC7C0', description: 'Raw material & component sources' },
  Manufacturer: { color: '#7C9EE8', description: 'Assembly & production sites' },
  Port: { color: '#B48CE8', description: 'Shipping & freight terminals' },
  Distributor: { color: '#E8B84B', description: 'Regional distribution hubs' },
}

const RISK_LEVELS = [
  { tag: 'low', label: 'Low', color: 'bg-risk-low' },
  { tag: 'moderate', label: 'Moderate', color: 'bg-risk-moderate' },
  { tag: 'elevated', label: 'Elevated', color: 'bg-risk-elevated' },
  { tag: 'high', label: 'High', color: 'bg-risk-high' },
]

function countByLabel(nodes, label) {
  return nodes.filter((n) => n.label === label).length
}

export default function Sidebar({ nodes }) {
  return (
    <aside className="w-72 shrink-0 border-r border-border bg-panel/40 overflow-y-auto">
      <div className="p-5 space-y-8">
        {/* Node breakdown */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-3">
            Network Composition
          </h2>
          <div className="space-y-2">
            {Object.entries(NODE_TYPE_META).map(([label, meta]) => {
              const count = countByLabel(nodes, label)
              return (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-panel border border-border hover:border-signal/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-textPrimary leading-tight">{label}</p>
                      <p className="text-[10px] text-textMuted truncate">{meta.description}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-textSecondary shrink-0 ml-2">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Risk legend */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-3">
            Risk Level
          </h2>
          <div className="space-y-2">
            {RISK_LEVELS.map((r) => (
              <div key={r.tag} className="flex items-center gap-2.5 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                <span className="text-sm text-textSecondary">{r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Filters placeholder - wired up in Week 2 */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-textMuted mb-3">
            Filters
          </h2>
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
            <p className="text-xs text-textMuted">
              Industry &amp; risk filters connect in Week 2
            </p>
          </div>
        </section>
      </div>
    </aside>
  )
}