import type { PostSummary } from '@nexsift/contracts'
import { topicMeta } from '@/lib/topics'

export function RadarPanel({
  posts,
  labels,
}: {
  posts: PostSummary[]
  labels: { label: string; frequencies: string; selected: string; verified: string }
}) {
  const topSignals = posts.slice(0, 5)
  const frequencyCount = new Set(posts.flatMap((post) => post.topics)).size
  const verifiedPercentage = posts.length > 0 ? '100%' : '0%'

  return (
    <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="signal-dot" />
          <span className="eyebrow text-[var(--foreground)]">{labels.label}</span>
        </div>
        <span className="font-mono text-[10px] text-[var(--muted)]">CURATED / CURRENT</span>
      </div>

      <div className="grid grid-cols-3 border-b border-[var(--border)]">
        <Metric value={String(frequencyCount)} label={labels.frequencies} />
        <Metric value={String(topSignals.length)} label={labels.selected} />
        <Metric value={verifiedPercentage} label={labels.verified} />
      </div>

      <div className="p-5">
        <div className="mb-3 grid grid-cols-[1fr_auto] font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
          <span>Frequency / signal</span>
          <span>score</span>
        </div>
        <div className="space-y-2">
          {topSignals.map((post) => {
            const topic = post.topics[0]
            if (!topic) {
              return null
            }

            return (
              <div
                key={post.slug}
                data-topic={topic}
                className="topic-color grid grid-cols-[6rem_1fr_auto] items-center gap-3 border-t border-[var(--border)] py-3"
              >
                <span className="font-mono text-[10px] font-semibold text-[var(--topic-color)]">
                  {topicMeta[topic].shortLabel}
                </span>
                <span className="truncate text-xs text-[var(--muted-strong)]">
                  {post.title}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                  {post.relevanceScore.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.09]" />
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 border-r border-[var(--border)] p-4 last:border-r-0">
      <div className="font-mono text-xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-[var(--muted)]">{label}</div>
    </div>
  )
}
