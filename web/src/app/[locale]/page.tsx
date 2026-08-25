import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { siteConfig } from '@/config/site'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { CreatorCard } from '@/features/landing/creator-card'
import { PathTrail } from '@/features/landing/path-trail'
import { SignalArt } from '@/features/landing/signal-art'
import { TopicBands } from '@/features/landing/topic-bands'
import { TrustBand } from '@/features/landing/trust-band'
import { localizedAlternates } from '@/lib/alternates'
import { topicIcons } from '@/lib/topic-icons'
import { selectRadarSignals } from '@/lib/radar-signals'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { routing, type AppLocale } from '@/i18n/routing'
import { listPosts } from '@/lib/content'
import {
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { hasLocale } from 'next-intl'
import {
  getTranslations,
  setRequestLocale,
} from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const HOME_RADAR_LIMIT = 6

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params

  if (!hasLocale(routing.locales, rawLocale)) {
    return {}
  }

  const locale = rawLocale as AppLocale

  return {
    alternates: localizedAlternates(locale, '/'),
  }
}

export default async function HomePage({
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
  const posts = await listPosts()
  const topicCount = new Set(posts.map((post) => post.topic)).size
  const radarSignals = selectRadarSignals(posts, HOME_RADAR_LIMIT)
  const homePath = locale === 'pt-BR' ? '/' : `/${locale}`
  const topicsPath = locale === 'pt-BR' ? '/topics' : `/${locale}/topics`
  const aboutPath = `/${locale}/about`

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

      <main>
        <section className="relative overflow-hidden border-b border-(--border)">
          <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.16]" />
          <div className="hero-glow -right-32 -top-32 size-96 bg-(--signal) opacity-[0.1]" />
          <div className="hero-glow -bottom-40 left-1/4 size-96 bg-(--cyan) opacity-[0.07]" />
          <div className="page-shell relative grid items-center gap-6 py-8 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-24">
            {/* Desktop: coluna original intacta + radar à direita */}
            <div className="hidden lg:block">
              <h1 className="text-[clamp(3.2rem,6.5vw,6.8rem)] font-medium leading-[0.84] tracking-[-0.04em]">
                <span className="block">{t('hero.titleA')}</span>
                <span className="block text-(--signal)">{t('hero.titleB')}</span>
              </h1>
              <p className="mt-9 max-w-[56ch] text-[clamp(1rem,1.7vw,1.28rem)] leading-relaxed text-(--muted-strong)">
                {t('hero.description')}
              </p>
              <p className="mt-8 max-w-[56ch] font-mono text-sm leading-relaxed text-(--muted)">
                {t.rich('hero.pain', {
                  b: (chunks) => (
                    <span className="font-semibold text-(--foreground)">
                      {chunks}
                    </span>
                  ),
                })}
              </p>
              <p className="mt-6 max-w-sm font-mono text-sm leading-relaxed text-(--muted)">
                {t.rich('radar.definition', {
                  sinal: (chunks) => (
                    <span className="font-semibold text-(--signal)">{chunks}</span>
                  ),
                })}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-sm bg-(--signal) px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  {t('radar.viewAllCount', { count: posts.length })}
                  <ArrowUpRight size={15} />
                </Link>
                <Link
                  href={`${homePath}#process`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-(--muted-strong) hover:text-white"
                >
                  {t('hero.secondary')}
                  <ArrowDownRight size={15} />
                </Link>
              </div>
            </div>

            {/* Mobile: título antes do radar; CTAs e textos depois */}
            <div className="order-1 lg:hidden">
              <div className="text-center text-[clamp(2.1rem,9vw,4.4rem)] font-medium leading-[0.84] tracking-[-0.04em]">
                <span className="block">{t('hero.titleA')}</span>
                <span className="block text-(--signal)">{t('hero.titleB')}</span>
              </div>
            </div>

            <div className="radar-panel order-2 border border-(--border) bg-(--surface-soft)">
              <div className="flex items-center gap-2 border-b border-(--border) px-4 py-2.5 lg:px-5 lg:py-4">
                <span className="signal-dot" />
                <h2 className="eyebrow text-(--signal)">
                  {t('radar.eyebrow')}
                </h2>
              </div>
              <div className="px-4 pb-4 lg:px-5">
                <SignalLedger posts={radarSignals} limit={4} compact />
              </div>
            </div>

            <div className="order-3 flex flex-col lg:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-sm bg-(--signal) px-3 py-2 text-[13px] font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  {t('radar.viewAllCount', { count: posts.length })}
                  <ArrowUpRight size={15} />
                </Link>
                <Link
                  href={`${homePath}#process`}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-(--muted-strong) hover:text-white"
                >
                  {t('hero.secondary')}
                  <ArrowDownRight size={15} />
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--muted-strong)">
                {t('hero.description')}
              </p>
              <p className="mt-3 max-w-sm font-mono text-[13px] leading-relaxed text-(--muted)">
                {t.rich('radar.definition', {
                  sinal: (chunks) => (
                    <span className="font-semibold text-(--signal)">{chunks}</span>
                  ),
                })}
              </p>
            </div>
          </div>
        </section>

        <section id="topics" className="border-y border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <h2 className="max-w-md text-4xl font-medium tracking-[-0.04em] md:text-5xl">
                  {t('topics.title')}
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                  {t('topics.description')}
                </p>
                <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--signal)">
                  {t('topics.count', { count: posts.length })}
                </p>
              </div>
              <TopicBands posts={posts} />
            </div>
          </div>
        </section>

        <section className="page-shell py-20 lg:py-28">
          <div>
            <h2 className="max-w-4xl text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[0.95] tracking-[-0.04em]">
              <span className="block">{t('why.titleA')}</span>
              <span className="block text-(--signal)">{t('why.titleB')}</span>
            </h2>
            <p className="mt-7 max-w-[72ch] text-lg leading-relaxed text-(--muted-strong)">
              {t('why.description')}
            </p>
            <p className="mt-5 max-w-[72ch] leading-relaxed text-(--muted)">
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
          </div>
        </section>

        <section aria-hidden className="overflow-hidden border-y border-(--border)">
          <SignalArt className="block h-auto w-full" />
        </section>

        <section id="process" className="border-b border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <h2 className="max-w-md text-4xl font-medium tracking-[-0.04em] md:text-5xl">
                  {t('process.title')}
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                  {t('process.description')}
                </p>
                <p className="mt-5 max-w-sm font-mono text-xs leading-relaxed text-(--signal)">
                  {t('process.scarcity')}
                </p>
              </div>
              <PathTrail
                steps={[
                  t('process.steps.0'),
                  t('process.steps.1'),
                  t('process.steps.2'),
                  t('process.steps.3'),
                  t('process.steps.4'),
                ]}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-(--border)">
          <TrustBand
            posts={posts}
            labels={{
              title: t('trust.title'),
              description: t('trust.description'),
              signalsLabel: t('trust.signalsLabel', { count: posts.length }),
              publicationLabel: t('trust.publicationLabel'),
              publicationTooltip: t('trust.publicationTooltip'),
              verifiableLabel: t('trust.verifiableLabel'),
              verifiableTooltip: t('trust.verifiableTooltip'),
              topicsLabel: t('trust.topicsLabel', { count: topicCount }),
            }}
          />
        </section>

        <section className="page-shell pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <h2 className="max-w-md text-4xl font-medium tracking-[-0.04em] md:text-5xl">
                {t('explore.title')}
              </h2>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                {topicOrder.map((topic) => {
                  const meta = getTopicMeta(t, topic)
                  const count = posts.filter(
                    (post) => post.topic === topic,
                  ).length
                  const TopicIcon = topicIcons[topic]

                  return (
                    <Link
                      key={topic}
                      href={`/topics/${topic}`}
                      data-topic={topic}
                      className="topic-color flex items-center gap-1.5 rounded-(--radius-sm) border border-(--border) bg-(--surface-soft) px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-(--muted) transition-colors hover:border-(--topic-color) hover:bg-(--surface-raised) hover:text-(--topic-color)"
                    >
                      <TopicIcon size={11} strokeWidth={2} className="text-(--topic-color)" />
                      {meta.label}
                      <span className="text-(--topic-color)">{count}</span>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 grid gap-px border-y border-(--border) bg-(--border) sm:grid-cols-3">
                <ExploreCard
                  href="/blog"
                  index="01"
                  title={t('explore.fullRadar')}
                  body={t('explore.fullRadarBody')}
                />
                <ExploreCard
                  href={topicsPath}
                  index="02"
                  title={t('explore.topicsLink')}
                  body={t('explore.topicsLinkBody')}
                />
                <ExploreCard
                  href={aboutPath}
                  index="03"
                  title={t('explore.aboutLink')}
                  body={t('explore.aboutLinkBody')}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        locale={locale}
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}

function ExploreCard({
  href,
  index,
  title,
  body,
}: {
  href: string
  index: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-8 bg-(--surface) p-6 transition-colors hover:bg-(--surface-raised)"
    >
      <span className="font-mono text-[11px] tracking-[0.1em] text-(--muted)">
        {index}
      </span>
      <div>
        <div className="flex items-center justify-between gap-3 text-lg font-medium tracking-[-0.03em]">
          {title}
          <ArrowUpRight
            size={16}
            className="text-(--muted) transition-colors group-hover:text-(--signal)"
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-(--muted)">{body}</p>
      </div>
    </Link>
  )
}