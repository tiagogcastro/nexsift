import { getTopicMeta } from '@/lib/topics'
import type { PostSummary } from '@nexsift/schemas/post'
import { getTranslations } from 'next-intl/server'

export async function RadarPanel({ posts }: { posts: PostSummary[] }) {
  const t = await getTranslations()
  const topSignals = posts.slice(0, 5)
  const frequencyCount = new Set(posts.flatMap((post) => post.topics)).size
  const verifiedPercentage = posts.length > 0 ? '100%' : '0%'

  return (
    <div className="relative overflow-hidden border border-(--border) bg-(--surface-soft)">
      <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="signal-dot" />
          <span className="eyebrow text-(--foreground)">{t('signal.label')}</span>
        </div>
        <span className="font-mono text-[10px] text-(--muted)">{t('radar.badge')}</span>
      </div>

      <div className="grid grid-cols-3 border-b border-(--border)">
        <Metric value={String(frequencyCount)} label={t('signal.frequencies')} />
        <Metric value={String(topSignals.length)} label={t('signal.selected')} />
        <Metric value={verifiedPercentage} label={t('signal.verified')} />
      </div>

      <div className="p-5">
        <div className="mb-3 grid grid-cols-[1fr_auto] font-mono text-[9px] uppercase tracking-widest text-(--muted)">
          <span>{t('radar.frequencyHeader')}</span>
          <span>{t('radar.scoreHeader')}</span>
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
                className="topic-color grid grid-cols-[6rem_1fr_auto] items-center gap-3 border-t border-(--border) py-3"
              >
                <span className="font-mono text-[10px] font-semibold text-(--topic-color)">
                  {getTopicMeta(t, topic).shortLabel}
                </span>
                <span className="truncate text-xs text-(--muted-strong)">
                  {post.title}
                </span>
                <span className="font-mono text-xs font-bold text-(--foreground)">
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
    <div className="min-w-0 border-r border-(--border) p-4 last:border-r-0">
      <div className="font-mono text-xl font-semibold tracking-tighter text-(--foreground)">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-(--muted)">{label}</div>
    </div>
  )
}
