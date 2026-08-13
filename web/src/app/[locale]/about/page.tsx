import { ArrowUpRight } from 'lucide-react'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
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
            <p className="mt-10 max-w-3xl text-xl leading-relaxed text-(--muted-strong)">
              {t('about.body')}
            </p>

            <div className="mt-16 border-t border-(--border) pt-6">
              <Section eyebrow={t('about.signalTitle')} body={t('about.signalBody')} />
            </div>

            <div className="mt-16 border-t border-(--border) pt-6">
              <div className="eyebrow">{t('about.criteriaTitle')}</div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-(--muted)">
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
                    <div key={criterion} className="bg-(--background) p-6">
                      <div className="font-mono text-[10px] text-(--muted)">
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

            <div className="mt-16 border-t border-(--border) pt-6">
              <Section eyebrow={t('about.aiTitle')} body={t('about.aiBody')} />
            </div>

            <div className="mt-16 border-t border-(--border) pt-6">
              <Section
                eyebrow={t('about.relevanceTitle')}
                body={t('about.relevanceBody')}
              />
            </div>

            <div className="mt-16 border-t border-(--border) pt-6">
              <Section eyebrow={t('about.methodTitle')} body={t('about.methodBody')} />
            </div>

            <div className="mt-16 border-t border-(--border) pt-6">
              <div className="eyebrow text-(--signal)">{t('about.creatorEyebrow')}</div>
              <h2 className="mt-6 text-3xl font-medium tracking-[-0.05em] md:text-4xl">
                {t('about.creatorTitle')}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-(--muted-strong)">
                {t.rich('about.creatorBody', {
                  name: (chunks) => (
                    <a
                      href={siteConfig.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-(--signal) hover:underline"
                    >
                      {chunks}
                      <ArrowUpRight size={14} />
                    </a>
                  ),
                })}
              </p>
              <div className="mt-6 flex gap-5 text-sm text-(--muted-strong)">
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
      <p className="mt-4 max-w-3xl leading-relaxed text-(--muted-strong)">{body}</p>
    </section>
  )
}
