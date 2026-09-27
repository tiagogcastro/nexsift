import type { PostSummary } from '@nexsift/schemas/post'
import {
  publicationVerifiedSourcesRatio,
  verifiableSourcesRatio,
} from '@/lib/source-verification'

export interface TrustBandLabels {
  title: string
  description: string
  signalsLabel: string
  publicationLabel: string
  publicationTooltip: string
  verifiableLabel: string
  verifiableTooltip: string
  topicsLabel: string
}

export function TrustBand({
  posts,
  labels,
}: {
  posts: PostSummary[]
  labels: TrustBandLabels
}) {
  const topicCount = new Set(posts.map((post) => post.topic)).size
  const publicationPercent = Math.round(
    publicationVerifiedSourcesRatio(posts) * 100,
  )
  const verifiablePercent = Math.round(verifiableSourcesRatio(posts) * 100)

  return (
    <div className="page-shell py-7 lg:py-10">
      <div className="relative overflow-hidden border border-(--border) bg-(--surface-soft)">
        <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.12]" />
        <div className="relative grid gap-4 p-4 md:p-6 lg:grid-cols-[0.65fr_1.35fr] lg:gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="section-heading max-w-lg">
              {labels.title}
            </h2>
          </div>
          <div>
            <p className="intro-copy max-w-2xl text-(--muted-strong)">
              {labels.description}
            </p>
             <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat value={String(posts.length)} label={labels.signalsLabel} />
              <Stat
                value={`${publicationPercent}%`}
                label={labels.publicationLabel}
                tooltip={labels.publicationTooltip}
                bar={publicationPercent}
              />
              <Stat
                value={`${verifiablePercent}%`}
                label={labels.verifiableLabel}
                tooltip={labels.verifiableTooltip}
                bar={verifiablePercent}
              />
              <Stat value={String(topicCount)} label={labels.topicsLabel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  tooltip,
  bar,
}: {
  value: string
  label: string
  tooltip?: string
  bar?: number
}) {
  return (
    <div title={tooltip} className="min-w-0 border-l-2 border-(--border) pl-3 lg:pl-4">
      <div className="font-mono text-[clamp(1.35rem,2.4vw,2.3rem)] font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-snug uppercase tracking-[0.04em] text-(--muted) lg:text-[11px]">
        {label}
      </div>
      {typeof bar === 'number' ? (
        <div className="stat-bar mt-3">
          <div
            className="stat-bar-fill"
            style={{ transform: `scaleX(${Math.max(bar, 2) / 100})` }}
          />
        </div>
      ) : null}
    </div>
  )
}
