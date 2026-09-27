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
            className="topic-color group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 border-b border-(--border) py-4 transition-colors hover:bg-(--topic-color)/[0.07] last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="font-mono text-xs text-(--muted)">{String(index + 1).padStart(2, '0')}</span>
              <TopicIcon
                size={16}
                strokeWidth={2}
                className="shrink-0 text-(--topic-color)"
              />
              <span className="min-w-0 truncate text-base font-medium tracking-[-0.03em] text-(--topic-color) sm:text-lg">
                <span className="sm:hidden">{topic === 'ai' ? meta.shortLabel : meta.label}</span><span className="hidden sm:inline">{meta.label}</span>
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs text-(--muted-strong)">
              {t('topics.count', { count })}
            </span>
            <span className="grid size-5 shrink-0 place-items-center text-(--muted) transition-colors group-hover:text-(--topic-color)">
              <ArrowUpRight size={15} />
            </span>
            <span className="col-span-3 pl-14 text-sm leading-snug text-(--muted) sm:text-[15px]">{meta.description}</span>
          </Link>
        )
      })}
    </div>
  )
}
