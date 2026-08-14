import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { siteConfig } from '@/config/site'
import { LeadModalTrigger } from '@/features/lead/lead-modal-trigger'
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
  const sinaisPath = locale === 'pt-BR' ? '/blog' : `/${locale}/blog`
  const topicsPath = locale === 'pt-BR' ? '/topics' : `/${locale}/topics`
  const aboutPath = `/${locale}/about`
  const privacyPath = `/${locale}/privacy`

  return (
    <footer className="border-t border-(--border) pb-10">
      <div className="page-shell pt-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Brand locale={locale} />
            <p className="max-w-sm text-sm text-(--muted)">{tagline}</p>
            <a
              href={siteConfig.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-md items-center gap-3 rounded-(--radius-sm) border border-(--border) bg-(--surface-soft) px-4 py-3 transition-colors hover:border-(--signal)"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-(--border-strong) bg-(--surface-raised) font-mono text-xs font-semibold text-(--signal)">
                TC
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-(--foreground)">
                  {builtBy}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-(--muted)">
                  LinkedIn <ArrowUpRight size={11} className="inline" />
                </span>
              </span>
            </a>
          </div>

          <div>
            <div className="eyebrow">{t('footer.product')}</div>
            <ul className="mt-4 space-y-2.5 text-sm text-(--muted-strong)">
              <li>
                <Link href={sinaisPath} className="hover:text-white">
                  {t('nav.blog')}
                </Link>
              </li>
              <li>
                <Link href={topicsPath} className="hover:text-white">
                  {t('nav.topics')}
                </Link>
              </li>
              <li>
                <Link href={aboutPath} className="hover:text-white">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow">{t('footer.contact')}</div>
            <ul className="mt-4 space-y-2.5 text-sm text-(--muted-strong)">
              <li>
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white"
                >
                  GitHub <ArrowUpRight size={13} />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white"
                >
                  LinkedIn <ArrowUpRight size={13} />
                </a>
              </li>
              <li>
                <Link href={privacyPath} className="hover:text-white">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow">{t('footer.updates')}</div>
            <p className="mt-4 max-w-xs text-sm text-(--muted-strong)">
              {t('footer.updatesBody')}
            </p>
            <div className="mt-5">
              <LeadModalTrigger variant="footer" />
            </div>
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