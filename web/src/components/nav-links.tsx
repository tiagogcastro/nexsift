'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { topicSchema, type Topic } from '@nexsift/schemas/topic'

interface NavLabels {
  blog: string
  topics: string
  process: string
  about: string
}

function topicFromPath(pathname: string): Topic | undefined {
  const match = pathname.match(/^\/topics\/([a-z-]+)$/)

  if (!match) {
    return undefined
  }

  const result = topicSchema.safeParse(match[1])

  return result.success ? result.data : undefined
}

export function NavLinks({
  locale,
  labels,
}: {
  locale: string
  labels: NavLabels
}) {
  const pathname = usePathname()
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/')
  const isAbout = pathname === '/about' || pathname.startsWith('/about/')
  const isTopics = pathname.startsWith('/topics/')
  const activeTopic = topicFromPath(pathname)

  const linkClass =
    'flex items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 transition-colors hover:bg-(--surface-raised) hover:text-white'
  const activeClass = 'text-(--foreground)'
  const inactiveClass = 'text-(--muted-strong)'

  return (
    <nav className="hidden items-center gap-7 text-sm lg:flex">
      <Link
        href="/blog"
        className={`${linkClass} ${isBlog ? activeClass : inactiveClass}`}
      >
        {isBlog ? <ActiveDot topic={activeTopic} /> : null}
        {labels.blog}
      </Link>
      <Link
        href={`/${locale}#topics`}
        className={`${linkClass} ${isTopics ? activeClass : inactiveClass}`}
      >
        {isTopics ? <ActiveDot topic={activeTopic} /> : null}
        {labels.topics}
      </Link>
      <Link href={`/${locale}#process`} className={`${linkClass} ${inactiveClass}`}>
        {labels.process}
      </Link>
      <Link
        href={`/${locale}/about`}
        className={`${linkClass} ${isAbout ? activeClass : inactiveClass}`}
      >
        {isAbout ? <ActiveDot topic={undefined} /> : null}
        {labels.about}
      </Link>
    </nav>
  )
}

function ActiveDot({ topic }: { topic: Topic | undefined }) {
  if (topic) {
    return (
      <span
        data-topic={topic}
        className="topic-color size-1.5 rounded-full bg-(--topic-color)"
      />
    )
  }

  return <span className="size-1.5 rounded-full bg-(--signal)" />
}
