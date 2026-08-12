import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { AppLocale } from '@/i18n/routing'
import { Brand } from './brand'
import { LocaleSwitcher } from './locale-switcher'

interface HeaderLabels {
  blog: string
  topics: string
  process: string
  about: string
  today: string
}

export function Header({
  locale,
  labels,
}: {
  locale: AppLocale
  labels: HeaderLabels
}) {
  return (
    <header className="border-b border-[var(--border)] bg-[#090b0de6] backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-6">
        <Brand locale={locale} />

        <nav className="hidden items-center gap-7 text-sm text-[var(--muted-strong)] lg:flex">
          <Link className="transition-colors hover:text-white" href="/blog">
            {labels.blog}
          </Link>
          <Link
            className="transition-colors hover:text-white"
            href={`/${locale}#topics`}
          >
            {labels.topics}
          </Link>
          <Link
            className="transition-colors hover:text-white"
            href={`/${locale}#process`}
          >
            {labels.process}
          </Link>
          <Link
            className="transition-colors hover:text-white"
            href={`/${locale}/about`}
          >
            {labels.about}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher locale={locale} />
          <Link
            href="/blog"
            className="hidden items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--signal)] px-3.5 py-2 text-xs font-semibold text-[#0b0d0a] transition-transform hover:-translate-y-0.5 sm:flex"
          >
            {labels.today}
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  )
}
