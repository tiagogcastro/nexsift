import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { PathTrail } from '@/features/landing/path-trail'
import { SignalExample } from '@/features/landing/signal-example'
import { SectionArt } from '@/features/landing/section-art'
import { SignalArt } from '@/features/landing/signal-art'
import { TopicBands } from '@/features/landing/topic-bands'
import { TrustBand } from '@/features/landing/trust-band'
import { localizedAlternates } from '@/lib/alternates'
import { topicIcons } from '@/lib/topic-icons'
import { selectRadarSignals } from '@/lib/radar-signals'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { routing, type AppLocale } from '@/i18n/routing'
import { getPostBySlug, listPosts } from '@/lib/content'
import {
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
  const exampleSummary = posts.find((post) => post.sources.length > 0)
  const examplePost = exampleSummary ? await getPostBySlug(exampleSummary.slug) : null
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
          <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.06]" />
          <SignalArt className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]" />
          <div className="page-shell relative grid items-center gap-5 py-10 md:gap-10 md:py-24 lg:min-h-[min(720px,calc(100vh-4rem))] lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <h1 className="max-w-[22ch] text-[clamp(2rem,8vw,2.6rem)] font-medium leading-[1.02] tracking-[-0.04em] md:max-w-[20ch] md:text-[clamp(2.6rem,5vw,5.4rem)] md:leading-[0.98]">
                {t('hero.titleA')} <span className="text-(--signal)">{t('hero.titleB')}</span>
              </h1>
              <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-(--muted-strong) md:mt-7 md:text-[19px] md:leading-relaxed">
                {t('hero.description')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="inline-flex items-center gap-2 rounded-sm bg-(--signal) px-4 py-2.5 text-sm font-semibold text-(--on-signal) transition-colors hover:bg-(--foreground)">
                  {t('hero.primary')} <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] md:mt-5">
                <span className="rounded-full border border-(--border) bg-(--surface) px-2.5 py-1 text-(--muted-strong)">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                <span className="rounded-full border border-(--border) bg-(--surface) px-2.5 py-1 text-(--muted-strong)">{t('hero.badges.verified')}</span>
                <span className="rounded-full border border-(--border) bg-(--surface) px-2.5 py-1 text-(--muted-strong)">{t('hero.badges.reading')}</span>
              </div>
            </div>

            <div className="radar-panel border border-(--border) bg-(--surface-soft)">
              <div className="flex items-center gap-2 border-b border-(--border) px-3 py-2 lg:px-5 lg:py-4">
                <span className="signal-dot" />
                <h2 className="eyebrow text-(--signal)">
                  {t('radar.eyebrow')}
                </h2>
              </div>
              <div className="px-3 pb-1 lg:px-5">
                <SignalLedger posts={radarSignals} limit={4} compact />
              </div>
            </div>

          </div>
        </section>

        <section id="process" className="border-b border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-16 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <p className="eyebrow mb-4">{t('process.eyebrow')}</p>
                <h2 className="section-heading max-w-md">{t('process.title')}</h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">{t('process.description')}</p>
              </div>
              <PathTrail steps={[t('process.steps.0'), t('process.steps.1'), t('process.steps.2'), t('process.steps.3'), t('process.steps.4')]} />
            </div>
          </div>
        </section>

        {examplePost?.sources.length ? (
          <SignalExample
            post={examplePost}
            labels={{
              eyebrow: t('example.eyebrow'),
              title: t('example.title'),
              description: t('example.description'),
              source: t('example.source'),
              summary: t('example.summary'),
              why: t('blog.why'),
              read: t('example.read'),
              openSource: t('example.openSource'),
            }}
          />
        ) : null}

        <SectionArt variant="filter" />

        <section id="topics" className="border-y border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <h2 className="section-heading max-w-md">
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

        <SectionArt variant="trace" />

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
              <h2 className="section-heading max-w-md">
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
        <div className="flex items-center justify-between gap-3 text-base font-medium tracking-[-0.03em]">
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
