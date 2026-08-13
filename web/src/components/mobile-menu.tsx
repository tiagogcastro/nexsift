'use client'

import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface MobileMenuProps {
  locale: string
  labels: {
    blog: string
    topics: string
    process: string
    about: string
    today: string
  }
}

function topicFromPath(pathname: string): Topic | undefined {
  const match = pathname.match(/^\/topics\/([a-z-]+)$/)

  if (!match) {
    return undefined
  }

  const result = topicSchema.safeParse(match[1])

  return result.success ? result.data : undefined
}

export function MobileMenu({ locale, labels }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/')
  const isAbout = pathname === '/about' || pathname.startsWith('/about/')
  const isTopics = pathname.startsWith('/topics/')
  const activeTopic = topicFromPath(pathname)
  const homePath = locale === 'pt-BR' ? '/' : `/${locale}`

  const close = () => setOpen(false)

  const scrollToHash = (href: string) => {
    const hashIndex = href.indexOf('#')

    if (hashIndex === -1) {
      return
    }

    const path = href.slice(0, hashIndex) || '/'
    const hash = href.slice(hashIndex)

    if (window.location.pathname !== path || window.location.hash !== hash) {
      return
    }

    document
      .querySelector(hash)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itemClass =
    'flex min-h-12 items-center gap-3 border-b border-(--border) px-5 text-base transition-colors last:border-b-0'

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="grid size-10 place-items-center rounded-sm text-(--muted-strong) transition-colors hover:bg-(--surface-raised) hover:text-(--foreground)"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-(--border) bg-(--surface-raised)">
          <div className="page-shell flex flex-col py-2">
            <Link
              href="/blog"
              onClick={close}
              className={`${itemClass} ${isBlog ? 'text-(--foreground)' : 'text-(--muted-strong)'}`}
            >
              {isBlog ? <ActiveDot topic={activeTopic} /> : null}
              {labels.blog}
            </Link>
            <Link
              href={`${homePath}#topics`}
              onClick={(event) => {
                scrollToHash(event.currentTarget.getAttribute('href') ?? '')
                close()
              }}
              className={`${itemClass} ${isTopics ? 'text-(--foreground)' : 'text-(--muted-strong)'}`}
            >
              {isTopics ? <ActiveDot topic={activeTopic} /> : null}
              {labels.topics}
            </Link>
            <Link
              href={`${homePath}#process`}
              onClick={(event) => {
                scrollToHash(event.currentTarget.getAttribute('href') ?? '')
                close()
              }}
              className={`${itemClass} text-(--muted-strong)`}
            >
              {labels.process}
            </Link>
            <Link
              href={`/${locale}/about`}
              onClick={close}
              className={`${itemClass} ${isAbout ? 'text-(--foreground)' : 'text-(--muted-strong)'}`}
            >
              {isAbout ? <ActiveDot topic={undefined} /> : null}
              {labels.about}
            </Link>
            <div className="p-5">
              <Link
                href="/blog"
                onClick={close}
                className="flex h-11 items-center justify-center gap-2 rounded-sm bg-(--signal) px-4 text-sm font-semibold text-black"
              >
                {labels.today}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ActiveDot({ topic }: { topic: Topic | undefined }) {
  if (topic) {
    return (
      <span
        data-topic={topic}
        className="topic-color size-1.5 shrink-0 rounded-full bg-(--topic-color)"
      />
    )
  }

  return <span className="size-1.5 shrink-0 rounded-full bg-(--signal)" />
}
