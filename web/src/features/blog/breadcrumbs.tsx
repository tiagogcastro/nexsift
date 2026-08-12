import Link from 'next/link'
import type { Topic } from '@nexsift/schemas/topic'

export function Breadcrumbs({
  items,
  topic,
}: {
  items: { label: string; href?: string }[]
  topic: Topic | undefined
}) {
  return (
    <nav
      data-topic={topic}
      className="topic-color mb-7 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-(--muted)"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const label = item.href ? (
          <Link
            href={item.href}
            className="transition-colors hover:text-(--foreground)"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={`max-w-[16rem] truncate ${
              topic ? 'text-(--topic-color)' : 'text-(--foreground)'
            }`}
          >
            {item.label}
          </span>
        )

        return (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-(--muted)">/</span> : null}
            {label}
          </span>
        )
      })}
    </nav>
  )
}
