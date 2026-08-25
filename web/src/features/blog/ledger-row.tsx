import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import { formatCompactDate } from '@/lib/date'
import { isSignalWithinDays } from '@/lib/recency'
import { topicIcons } from '@/lib/topic-icons'

const NEW_BADGE_DAYS = 5

export function LedgerRow({
  post,
  index,
  topicLabel,
  relevanceLabel,
  newLabel,
  sourcesLabel,
  fallbackLabel,
  compact = false,
}: {
  post: PostSummary
  index: number
  topicLabel: string | undefined
  relevanceLabel: string
  newLabel: string
  sourcesLabel: string
  fallbackLabel: string
  compact?: boolean
}) {
  const topic = post.topic
  const isNew = isSignalWithinDays(post.publishedAt, NEW_BADGE_DAYS)
  const TopicIcon = topicIcons[topic]

  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      data-topic={topic}
      className={`signal-ledger-row topic-color ${compact ? 'ledger-row-compact' : ''}`}
    >
      <span className="font-mono text-[11px] text-(--muted)">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 py-4">
        <div className="flex items-start gap-4">
          {!compact && post.coverImage ? (
            <div className="hidden h-20 w-32 shrink-0 overflow-hidden border border-(--border) bg-(--surface-soft) md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/s3/${post.coverImage.objectKey}`}
                alt={post.coverImage.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-mono text-xs font-semibold tracking-[0.04em] text-(--topic-color)">
              {TopicIcon ? <TopicIcon size={12} strokeWidth={2} /> : null}
              {topicLabel ?? fallbackLabel}
              {isNew ? (
                <span className="rounded-(--radius-sm) bg-(--signal) px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-black">
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
        </div>
      </div>
      <div className="flex min-w-0 items-baseline justify-end gap-1.5 pl-2 text-right">
        <span className="font-mono text-sm font-semibold leading-none text-(--signal)">
          {post.relevanceScore.toFixed(1)}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-(--muted)">
          <span className="hidden sm:inline">{relevanceLabel} · </span>
          {!compact ? `${post.sources.length} ${sourcesLabel} · ` : null}
          {formatCompactDate(post.publishedAt)}
        </span>
      </div>
      <ArrowUpRight
        size={15}
        className="hidden text-(--muted) sm:block"
        strokeWidth={1.7}
      />
    </Link>
  )
}
