import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { topicMeta } from '@/lib/topics'

export function TopicBands() {
  return (
    <div className="border-y border-[var(--border)]">
      {Object.entries(topicMeta).map(([topic, meta], index) => (
        <Link
          key={topic}
          href={`/topics/${topic}`}
          data-topic={topic}
          className="topic-color group grid min-h-24 grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-[var(--border)] last:border-b-0 md:grid-cols-[5rem_0.8fr_2fr_auto]"
        >
          <span className="font-mono text-[10px] text-[var(--muted)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-lg font-medium tracking-[-0.03em] text-[var(--topic-color)]">
            {meta.label}
          </span>
          <span className="hidden max-w-2xl text-sm text-[var(--muted)] md:block">
            {meta.description}
          </span>
          <span className="grid size-8 place-items-center text-[var(--muted)] transition-colors group-hover:text-[var(--topic-color)]">
            <ArrowUpRight size={16} />
          </span>
        </Link>
      ))}
    </div>
  )
}
