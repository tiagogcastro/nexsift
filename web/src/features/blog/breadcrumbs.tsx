import Link from 'next/link'
import type { Topic } from '@nexsift/schemas/topic'
import { topicIcons } from '@/lib/topic-icons'

export function Breadcrumbs({
  items,
  topic,
  topicChip = false,
  badge,
}: {
  items: { label: string; href?: string }[]
  topic: Topic | undefined
  topicChip?: boolean
  badge?: string | undefined
}) {
  const TopicIcon = topic ? topicIcons[topic] : null

  return (
    <nav
      data-topic={topic}
      className="topic-color mb-5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap font-mono text-[10px] text-(--muted) sm:gap-2 sm:text-[11px]"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isTopicChip = topicChip && topic && item.href === `/topics/${topic}`
        const label = isTopicChip && TopicIcon ? (
          <Link href={item.href!} className="topic-chip max-w-[60vw] shrink-0 hover:border-(--topic-color)">
            <TopicIcon size={11} strokeWidth={2} className="shrink-0 text-(--topic-color)" />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        ) : item.href ? (
          <Link
            href={item.href}
            className="transition-colors hover:text-(--foreground)"
          >
            {item.label}
          </Link>
        ) : (
          <span className={`block truncate ${topic ? 'text-(--topic-color)' : 'text-(--foreground)'}`}>
            {item.label}
          </span>
        )

        return (
          <span key={item.label} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {index > 0 ? <span className="text-(--muted)">/</span> : null}
            {label}
          </span>
        )
      })}
      {badge ? (
        <span className="hidden shrink-0 rounded-(--radius-sm) bg-(--signal) px-1.5 py-0.5 font-semibold uppercase text-(--on-signal) sm:inline-flex">
          {badge}
        </span>
      ) : null}
    </nav>
  )
}
