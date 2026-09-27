import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { CreatorCard } from '@/features/landing/creator-card'
import { siteConfig } from '@/config/site'
import { localizedAlternates } from '@/lib/alternates'
import { routing, type AppLocale } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale })
  return {
    title: t('about.metaTitle'),
    description: t('about.metaDescription'),
    alternates: localizedAlternates(locale as AppLocale, '/about'),
    openGraph: { title: t('about.metaTitle'), description: t('about.metaDescription'), url: locale === 'pt-BR' ? '/about' : `/${locale}/about`, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: t('about.metaTitle'), description: t('about.metaDescription'), images: ['/opengraph-image'] },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  if (!hasLocale(routing.locales, rawLocale)) notFound()
  const locale = rawLocale as AppLocale
  setRequestLocale(locale)
  const t = await getTranslations()

  return <>
    <Header locale={locale} labels={{ blog: t('nav.blog'), topics: t('nav.topics'), process: t('nav.process'), about: t('nav.about'), today: t('nav.today') }} />
    <main className="page-shell min-h-[70vh] py-10 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow mb-4">{t('about.eyebrow')}</p>
          <h1 className="page-heading max-w-xl">{t('about.title')}</h1>
          <p className="intro-copy mt-4 max-w-md text-(--muted-strong)">{t('about.body')}</p>
        </div>
        <div>
          <CreatorCard labels={{ eyebrow: t('about.creatorEyebrow'), title: t('about.creatorTitle'), body: t.rich('about.creatorBody', {
            name: (chunks) => <a href={siteConfig.websiteUrl} target="_blank" rel="noreferrer" className="font-semibold text-(--signal) underline underline-offset-4">{chunks}</a>,
          }) }} />
          <section className="mt-9 border-t border-(--border) pt-6">
            <h2 className="section-heading">{t('about.criteriaTitle')}</h2>
            <p className="mt-2 text-sm text-(--muted)">{t('about.criteriaIntro')}</p>
            <div className="mt-5 grid gap-px bg-(--border) sm:grid-cols-3">
              {[t('about.criteriaA'), t('about.criteriaB'), t('about.criteriaC')].map((criterion, index) => <div key={criterion} className="bg-(--surface) p-4">
                <span className="font-mono text-xs text-(--signal)">0{index + 1}</span>
                <p className="mt-2 text-sm leading-relaxed">{criterion}</p>
              </div>)}
            </div>
          </section>
          <section className="mt-8 grid gap-6 border-t border-(--border) pt-6 sm:grid-cols-2">
            <div><h2 className="eyebrow text-(--signal)">{t('about.aiTitle')}</h2><p className="mt-2 text-sm leading-relaxed text-(--muted-strong)">{t('about.aiBody')}</p></div>
            <div><h2 className="eyebrow text-(--signal)">{t('about.relevanceTitle')}</h2><p className="mt-2 text-sm leading-relaxed text-(--muted-strong)">{t('about.relevanceBody')}</p></div>
          </section>
        </div>
      </div>
    </main>
    <Footer locale={locale} tagline={t('footer.tagline')} builtBy={t('footer.builtBy')} />
  </>
}
