import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { siteConfig } from '@/config/site'
import type { AppLocale } from '@/i18n/routing'
import { Brand } from './brand'

export async function Footer({
  locale,
  tagline,
  builtBy,
}: {
  locale: AppLocale
  tagline: string
  builtBy: string
}) {
  const t = await getTranslations()

  return (
    <footer className="pb-10">
      <div className="page-shell border-t border-(--border) pt-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <Brand locale={locale} />
            <p className="max-w-sm text-sm text-(--muted)">{tagline}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-(--muted)">
              {builtBy}
            </p>
          </div>
          <div className="flex gap-5 text-sm text-(--muted-strong)">
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
        <div className="mt-10 border-t border-(--border) pt-5">
          <p className="max-w-3xl font-mono text-[10px] leading-relaxed text-(--muted)">
            {t('notice.short')}
          </p>
        </div>
      </div>
    </footer>
  )
}
