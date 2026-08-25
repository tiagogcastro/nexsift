import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { PostSummary } from '@nexsift/schemas/post'
import { topicIcons } from '@/lib/topic-icons'
import { getTopicMeta, topicOrder } from '@/lib/topics'

export async function TopicBands({ posts }: { posts: PostSummary[] }) {
  const t = await getTranslations()

  return (
    <div className="border-y border-(--border)">
      {topicOrder.map((topic, index) => {
        const meta = getTopicMeta(t, topic)
        const count = posts.filter((post) => post.topic === topic).length
        const TopicIcon = topicIcons[topic]

        return (
          <Link
            key={topic}
            href={`/topics/${topic}`}
            data-topic={topic}
            className="topic-color group grid grid-cols-[3rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-(--border) py-5 transition-colors hover:bg-(--topic-color)/[0.07] last:border-b-0 md:grid-cols-[5rem_2fr_minmax(0,1.6fr)_auto_auto] md:gap-4"
          >
            <span className="font-mono text-[11px] text-(--muted)">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <TopicIcon
                size={16}
                strokeWidth={2}
                className="shrink-0 text-(--topic-color)"
              />
              <span className="truncate text-lg font-medium tracking-[-0.03em] text-(--topic-color)">
                {meta.label}
              </span>
            </span>
            <span className="hidden max-w-[56ch] text-sm text-(--muted) md:block">
              {meta.description}
            </span>
            <span className="topic-chip">
              {t('topics.count', { count })}
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