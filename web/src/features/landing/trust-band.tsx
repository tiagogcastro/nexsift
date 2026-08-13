import type { PostSummary } from '@nexsift/schemas/post'
import {
  publicationVerifiedSourcesRatio,
  verifiableSourcesRatio,
} from '@/lib/source-verification'

export interface TrustBandLabels {
  eyebrow: string
  title: string
  description: string
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
  const topicCount = new Set(posts.flatMap((post) => post.topics)).size
  const publicationPercent = `${Math.round(
    publicationVerifiedSourcesRatio(posts) * 100,
  )}%`
  const verifiablePercent = `${Math.round(verifiableSourcesRatio(posts) * 100)}%`

  return (
    <div className="page-shell grid gap-8 py-20 lg:grid-cols-[0.65fr_1.35fr] lg:py-28">
      <div className="eyebrow text-(--signal)">{labels.eyebrow}</div>
      <div>
        <h2 className="max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-medium leading-[0.96] tracking-[-0.065em]">
          {labels.title}
        </h2>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-(--muted-strong)">
          {labels.description}
        </p>
        <div className="mt-12 grid grid-cols-1 border-y border-(--border) sm:grid-cols-3">
          <Stat
            value={publicationPercent}
            label={labels.publicationLabel}
            tooltip={labels.publicationTooltip}
          />
          <Stat
            value={verifiablePercent}
            label={labels.verifiableLabel}
            tooltip={labels.verifiableTooltip}
          />
          <Stat value={String(topicCount)} label={labels.topicsLabel} />
        </div>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  tooltip,
}: {
  value: string
  label: string
  tooltip?: string
}) {
  return (
    <div
      title={tooltip}
      className="border-b border-(--border) px-2 py-6 sm:border-b-0 sm:border-r sm:last:border-r-0"
    >
      <div className="font-mono text-3xl font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-(--muted)">
        {label}
      </div>
    </div>
  )
}
