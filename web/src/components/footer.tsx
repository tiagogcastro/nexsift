import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { siteConfig } from '@/config/site'
import type { AppLocale } from '@/i18n/routing'
import { Brand } from './brand'

export function Footer({
  locale,
  tagline,
  builtBy,
}: {
  locale: AppLocale
  tagline: string
  builtBy: string
}) {
  return (
    <footer className="border-t border-[var(--border)] py-10">
      <div className="page-shell grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-4">
          <Brand locale={locale} />
          <p className="max-w-sm text-sm text-[var(--muted)]">{tagline}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            {builtBy}
          </p>
        </div>
        <div className="flex gap-5 text-sm text-[var(--muted-strong)]">
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white"
          >
            GitHub <ArrowUpRight size={13} />
          </a>
          <a
            href={siteConfig.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white"
          >
            LinkedIn <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </footer>
  )
}
