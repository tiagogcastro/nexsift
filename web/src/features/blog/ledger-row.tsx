import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import { formatCompactDate } from '@/lib/date'
import { isSignalWithinDays } from '@/lib/recency'

const NEW_BADGE_DAYS = 7

export function LedgerRow({
  post,
  index,
  shortLabel,
  signalTypeLabel,
  relevanceLabel,
  newLabel,
  sourcesLabel,
  fallbackLabel,
  compact = false,
}: {
  post: PostSummary
  index: number
  shortLabel: string | undefined
  signalTypeLabel: string | undefined
  relevanceLabel: string
  newLabel: string
  sourcesLabel: string
  fallbackLabel: string
  compact?: boolean
}) {
  const topic = post.topics[0]
  const isNew = isSignalWithinDays(post.publishedAt, NEW_BADGE_DAYS)

  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      data-topic={topic}
      className="signal-ledger-row topic-color"
    >
      <span className="font-mono text-[11px] text-(--muted)">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 py-4">
        <span className="signal-ledger-topic flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-(--topic-color)">
          <span className="h-px w-4 bg-(--topic-color)" />
          {shortLabel ?? fallbackLabel}
          {signalTypeLabel ? (
            <span className="text-(--muted)">· {signalTypeLabel}</span>
          ) : null}
          {isNew ? (
            <span className="rounded-(--radius-sm) bg-(--signal) px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-black">
              {newLabel}
            </span>
          ) : null}
        </span>
        <h3
          className={`signal-title mt-2 font-medium leading-snug tracking-[-0.025em] text-(--foreground) ${
            compact
              ? 'text-[clamp(0.9rem,1.15vw,1.05rem)]'
              : 'text-[clamp(1rem,1.4vw,1.22rem)]'
          }`}
        >
          {post.title}
        </h3>
        {!compact ? (
          <p className="mt-1.5 hidden max-w-3xl text-sm leading-relaxed text-(--muted) md:block">
            {post.description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1 pl-2 text-right">
        <span className="font-mono text-xs font-semibold text-(--foreground)">
          {relevanceLabel} {post.relevanceScore.toFixed(1)}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted)">
          {formatCompactDate(post.publishedAt)}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted)">
          {post.sources.length} {sourcesLabel}
        </span>
      </div>
      <ArrowUpRight size={15} className="text-(--muted)" strokeWidth={1.7} />
    </Link>
  )
}
