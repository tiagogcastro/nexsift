import { getTopicMeta } from '@/lib/topics'
import {
  publicationVerifiedSourcesRatio,
  verifiableSourcesRatio,
} from '@/lib/source-verification'
import type { PostSummary } from '@nexsift/schemas/post'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function RadarPanel({
  posts,
  topSignals,
}: {
  posts: PostSummary[]
  topSignals: PostSummary[]
}) {
  const t = await getTranslations()
  const topicCount = new Set(posts.flatMap((post) => post.topics)).size
  const verifiableRatio = verifiableSourcesRatio(topSignals)
  const verifiablePercentage = `${Math.round(verifiableRatio * 100)}%`
  const publicationRatio = publicationVerifiedSourcesRatio(topSignals)
  const publicationPercentage = `${Math.round(publicationRatio * 100)}%`

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
        <Metric
          value={String(topicCount)}
          label={t('signal.topics', { count: topicCount })}
        />
        <Metric
          value={String(topSignals.length)}
          label={t('signal.selected', { count: topSignals.length })}
        />
        <Metric
          value={verifiablePercentage}
          label={t('radar.verifiableLabel')}
          title={t('radar.verifiableTooltip')}
        />
      </div>

      <div className="border-b border-(--border) px-5 py-3">
        <p
          className="font-mono text-[10px] leading-relaxed text-(--muted)"
          title={t('radar.publicationTooltip')}
        >
          {t('radar.publicationLabel')}:{' '}
          <span className="font-semibold text-(--foreground)">
            {publicationPercentage}
          </span>
        </p>
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
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-topic={topic}
                className="topic-color radar-signal-row group grid grid-cols-[6rem_1fr_auto] items-center gap-3 border-t border-(--border) py-3"
              >
                <span className="font-mono text-[10px] font-semibold text-(--topic-color)">
                  {getTopicMeta(t, topic).shortLabel}
                </span>
                <span className="truncate text-xs text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                  {post.title}
                </span>
                <span className="font-mono text-xs font-bold text-(--foreground)">
                  {post.relevanceScore.toFixed(1)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.09]" />
    </div>
  )
}

function Metric({
  value,
  label,
  title,
}: {
  value: string
  label: string
  title?: string
}) {
  return (
    <div
      title={title}
      className="min-w-0 border-r border-(--border) p-4 last:border-r-0"
    >
      <div className="font-mono text-xl font-semibold tracking-tighter text-(--foreground)">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-(--muted)">{label}</div>
    </div>
  )
}
