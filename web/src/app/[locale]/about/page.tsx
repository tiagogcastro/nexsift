import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { CreatorCard } from '@/features/landing/creator-card'
import { siteConfig } from '@/config/site'
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
  const aboutTitle = t('about.title')
  const titleSplitIndex = aboutTitle.lastIndexOf(',')
  const titleA =
    titleSplitIndex === -1 ? aboutTitle : aboutTitle.slice(0, titleSplitIndex + 1)
  const titleB =
    titleSplitIndex === -1 ? null : aboutTitle.slice(titleSplitIndex + 1).trim()

  const sections = [
    {
      index: '01',
      eyebrow: t('about.signalTitle'),
      body: t('about.signalBody'),
    },
    {
      index: '02',
      eyebrow: t('about.aiTitle'),
      body: t('about.aiBody'),
    },
    {
      index: '03',
      eyebrow: t('about.relevanceTitle'),
      body: t('about.relevanceBody'),
    },
    {
      index: '04',
      eyebrow: t('about.methodTitle'),
      body: t('about.methodBody'),
    },
  ]

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
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h1 className="max-w-xl text-[clamp(2.2rem,4.2vw,3.8rem)] font-medium leading-[0.95] tracking-[-0.04em]">
              <span className="block">{titleA}</span>
              {titleB ? <span className="block text-(--signal)">{titleB}</span> : null}
            </h1>
          </div>
          <div>
            <p className="max-w-[56ch] text-xl leading-relaxed text-(--muted-strong)">
              {t('about.body')}
            </p>

            <div className="mt-10">
              <CreatorCard
                labels={{
                  eyebrow: t('about.creatorEyebrow'),
                  title: t('about.creatorTitle'),
                  body: t.rich('about.creatorBody', {
                    name: (chunks) => (
                      <a
                        href={siteConfig.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-(--signal) underline decoration-(--signal)/40 underline-offset-4 transition-colors hover:decoration-(--signal)"
                      >
                        {chunks}
                      </a>
                    ),
                  }),
                }}
              />
            </div>

            <div className="mt-16 border-t border-(--border)">
              <div className="pt-6">
                <div className="eyebrow">{t('about.criteriaTitle')}</div>
                <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-(--muted)">
                  {t('about.criteriaIntro')}
                </p>
                <div className="mt-6 grid gap-px bg-(--border) md:grid-cols-3">
                  {[
                    t('about.criteriaA'),
                    t('about.criteriaB'),
                    t('about.criteriaC'),
                  ].map((criterion, index) => {
                    const colonIndex = criterion.indexOf(':')

                    return (
                      <div key={criterion} className="bg-(--surface) p-6">
                        <div className="font-mono text-[11px] text-(--muted)">
                          0{index + 1}
                        </div>
                        <p className="mt-10 text-base leading-relaxed tracking-[-0.015em]">
                          {colonIndex === -1 ? (
                            criterion
                          ) : (
                            <>
                              <span className="font-semibold text-(--signal)">
                                {criterion.slice(0, colonIndex)}
                              </span>
                              {criterion.slice(colonIndex)}
                            </>
                          )}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {sections.map((section) => (
              <div key={section.index} className="mt-16 border-t border-(--border)">
                <div className="grid gap-6 pt-6 md:grid-cols-[3rem_1fr]">
                  <span className="font-mono text-[11px] text-(--signal)">
                    {section.index}
                  </span>
                  <div>
                    <div className="eyebrow text-(--signal)">
                      {section.eyebrow}
                    </div>
                    <p className="mt-4 max-w-[56ch] leading-relaxed text-(--muted-strong)">
                      {section.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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