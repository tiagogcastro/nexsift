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
    <div className="page-shell py-14 lg:py-20">
      <div className="relative overflow-hidden border border-(--border) bg-(--surface-soft)">
        <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.12]" />
        <div className="relative grid gap-7 p-5 md:p-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="section-heading max-w-lg">
              {labels.title}
            </h2>
          </div>
          <div>
            <p className="intro-copy max-w-2xl text-(--muted-strong)">
              {labels.description}
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
    <div title={tooltip} className="border-l-2 border-(--border) pl-4">
      <div className="font-mono text-[clamp(1.75rem,2.4vw,2.3rem)] font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.1em] text-(--muted)">
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
