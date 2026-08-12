import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import { formatCompactDate } from '@/lib/date'

export function LedgerRow({
  post,
  index,
  shortLabel,
  fallbackLabel,
}: {
  post: PostSummary
  index: number
  shortLabel: string | undefined
  fallbackLabel: string
}) {
  const topic = post.topics[0]

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
      <span className="signal-ledger-topic flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-(--topic-color)">
        <span className="h-px w-4 bg-(--topic-color)" />
        {shortLabel ?? fallbackLabel}
      </span>
      <div className="signal-title min-w-0 py-4">
        <h3 className="text-[clamp(1rem,1.4vw,1.22rem)] font-medium leading-snug tracking-[-0.025em] text-(--foreground)">
          {post.title}
        </h3>
        <p className="mt-1.5 hidden max-w-3xl text-sm leading-relaxed text-(--muted) md:block">
          {post.description}
        </p>
      </div>
      <div className="flex items-center gap-3 pl-2">
        <div className="hidden text-right sm:block">
          <div className="font-mono text-xs font-semibold text-(--foreground)">
            {post.relevanceScore.toFixed(1)}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted)">
            {formatCompactDate(post.publishedAt)}
          </div>
        </div>
        <ArrowUpRight size={15} className="text-(--muted)" strokeWidth={1.7} />
      </div>
    </Link>
  )
}
