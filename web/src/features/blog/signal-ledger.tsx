import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import { formatCompactDate } from '@/lib/date'
import { topicMeta } from '@/lib/topics'

export function SignalLedger({
  posts,
  limit,
}: {
  posts: PostSummary[]
  limit?: number
}) {
  const visiblePosts = typeof limit === 'number' ? posts.slice(0, limit) : posts

  return (
    <div>
      {visiblePosts.map((post, index) => {
        const topic = post.topics[0]
        const meta = topic ? topicMeta[topic] : null

        return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            data-topic={topic}
            className="signal-ledger-row topic-color"
          >
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="signal-ledger-topic flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-[var(--topic-color)]">
              <span className="h-px w-4 bg-[var(--topic-color)]" />
              {meta?.shortLabel ?? 'SIGNAL'}
            </span>
            <div className="signal-title min-w-0 py-4">
              <h3 className="text-[clamp(1rem,1.4vw,1.22rem)] font-medium leading-snug tracking-[-0.025em] text-[var(--foreground)]">
                {post.title}
              </h3>
              <p className="mt-1.5 hidden max-w-3xl text-sm leading-relaxed text-[var(--muted)] md:block">
                {post.description}
              </p>
            </div>
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden text-right sm:block">
                <div className="font-mono text-xs font-semibold text-[var(--foreground)]">
                  {post.relevanceScore.toFixed(1)}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  {formatCompactDate(post.publishedAt)}
                </div>
              </div>
              <ArrowUpRight
                size={15}
                className="text-[var(--muted)]"
                strokeWidth={1.7}
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
