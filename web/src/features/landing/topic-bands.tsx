import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getTopicMeta, topicOrder } from '@/lib/topics'

export async function TopicBands() {
  const t = await getTranslations()

  return (
    <div className="border-y border-(--border)">
      {topicOrder.map((topic, index) => {
        const meta = getTopicMeta(t, topic)

        return (
          <Link
            key={topic}
            href={`/topics/${topic}`}
            data-topic={topic}
            className="topic-color group grid min-h-24 grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-(--border) last:border-b-0 md:grid-cols-[5rem_0.8fr_2fr_auto]"
          >
            <span className="font-mono text-[10px] text-(--muted)">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-lg font-medium tracking-[-0.03em] text-(--topic-color)">
              {meta.label}
            </span>
            <span className="hidden max-w-2xl text-sm text-(--muted) md:block">
              {meta.description}
            </span>
            <span className="grid size-8 place-items-center text-(--muted) transition-colors group-hover:text-(--topic-color)">
              <ArrowUpRight size={16} />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
