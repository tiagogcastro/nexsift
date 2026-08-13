import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { routing, type AppLocale } from '@/i18n/routing'

export default async function PrivacyPage({
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
          <div className="eyebrow">{t('privacy.eyebrow')}</div>
          <div>
            <h1 className="max-w-5xl text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('privacy.title')}
            </h1>
            <p className="mt-10 max-w-3xl text-lg leading-relaxed text-(--muted-strong)">
              {t('privacy.intro')}
            </p>

            <div className="mt-14 space-y-12 border-t border-(--border) pt-8">
              <Section
                eyebrow={t('privacy.collectTitle')}
                body={t('privacy.collectBody')}
              />
              <Section
                eyebrow={t('privacy.contentTitle')}
                body={t('privacy.contentBody')}
              />
              <Section
                eyebrow={t('privacy.rightsTitle')}
                body={t('privacy.rightsBody')}
              />
              <Section
                eyebrow={t('privacy.contactTitle')}
                body={t('privacy.contactBody')}
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-(--muted)">
                {t('privacy.updated')}
              </p>
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

function Section({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <section>
      <div className="eyebrow text-(--signal)">{eyebrow}</div>
      <p className="mt-4 max-w-3xl leading-relaxed text-(--muted-strong)">
        {body}
      </p>
    </section>
  )
}
