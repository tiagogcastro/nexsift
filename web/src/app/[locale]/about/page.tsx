import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { routing, type AppLocale } from '@/i18n/routing'

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params

  if (!hasLocale(routing.locales, rawLocale)) {
    notFound()
  }

  const locale = rawLocale as AppLocale
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <>
      <Header
        locale={locale}
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.45fr_1fr]">
          <div className="eyebrow">{t('about.eyebrow')}</div>
          <div>
            <h1 className="max-w-5xl text-[clamp(3.4rem,8vw,8rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('about.title')}
            </h1>
            <p className="mt-10 max-w-3xl text-xl leading-relaxed text-[var(--muted-strong)]">
              {t('about.body')}
            </p>

            <div className="mt-16 border-t border-[var(--border)] pt-6">
              <div className="eyebrow">{t('about.principleTitle')}</div>
              <div className="mt-6 grid gap-px bg-[var(--border)] md:grid-cols-3">
                {[
                  t('about.principleA'),
                  t('about.principleB'),
                  t('about.principleC'),
                ].map((principle, index) => (
                  <div key={principle} className="bg-[var(--background)] p-6">
                    <div className="font-mono text-[10px] text-[var(--muted)]">
                      0{index + 1}
                    </div>
                    <p className="mt-10 text-lg tracking-[-0.025em]">{principle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer
        locale={locale}
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
