export function StatsBand({
  signals,
  topics,
  avgRelevance,
  labels,
}: {
  signals: number
  topics: number
  avgRelevance: string
  labels: { signals: string; topics: string; avgRelevance: string }
}) {
  return (
    <div className="grid grid-cols-3 border-y border-(--border)">
      <Stat value={String(signals)} label={labels.signals} />
      <Stat value={String(topics)} label={labels.topics} />
      <Stat value={avgRelevance} label={labels.avgRelevance} />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-(--border) px-6 py-8 last:border-r-0">
      <div className="font-mono text-3xl font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-(--muted)">{label}</div>
    </div>
  )
}
