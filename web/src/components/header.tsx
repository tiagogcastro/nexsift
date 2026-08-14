import type { AppLocale } from '@/i18n/routing'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Brand } from './brand'
import { LocaleSwitcher } from './locale-switcher'
import { MobileMenu } from './mobile-menu'
import { NavLinks } from './nav-links'
import { LeadModalTrigger } from '@/features/lead/lead-modal-trigger'

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
    <header className="sticky top-0 z-40 border-b border-(--border) bg-(--header-bg) backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-6">
        <Brand locale={locale} />

        <NavLinks locale={locale} labels={labels} />

        <div className="flex items-center gap-3">
          <LocaleSwitcher locale={locale} />
          <LeadModalTrigger variant="header" />
          <MobileMenu locale={locale} labels={labels} />
          <Link
            href="/blog"
            className="hidden items-center gap-2 rounded-sm bg-(--signal) px-3.5 py-2 text-xs font-semibold text-black transition-transform hover:-translate-y-0.5 sm:flex"
          >
            {labels.today}
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  )
}
