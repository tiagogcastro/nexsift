import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { PathTrail } from '@/features/landing/path-trail'
import { SignalExample } from '@/features/landing/signal-example'
import { SignalArt } from '@/features/landing/signal-art'
import { TopicBands } from '@/features/landing/topic-bands'
import { TrustBand } from '@/features/landing/trust-band'
import { CreatorCard } from '@/features/landing/creator-card'
import { localizedAlternates } from '@/lib/alternates'
import { selectRadarSignals } from '@/lib/radar-signals'
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
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const HOME_RADAR_LIMIT = 6

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params

  if (!hasLocale(routing.locales, rawLocale)) {
    return {}
  }

  const locale = rawLocale as AppLocale
  const t = await getTranslations({ locale })

  return {
    title: t('homeMeta.title'),
    description: t('homeMeta.description'),
    alternates: localizedAlternates(locale, '/'),
    openGraph: { title: t('homeMeta.title'), description: t('homeMeta.description'), url: locale === 'pt-BR' ? '/' : `/${locale}`, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: t('homeMeta.title'), description: t('homeMeta.description'), images: ['/opengraph-image'] },
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
          <div className="page-shell relative grid items-center gap-5 py-9 md:gap-10 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <h1 className="max-w-[22ch] text-[clamp(2rem,8vw,2.6rem)] font-medium leading-[1.02] tracking-[-0.04em] md:max-w-[20ch] md:text-[clamp(2.6rem,5vw,5.4rem)] md:leading-[0.98]">
                {t('hero.titleA')} <span className="text-(--signal)">{t('hero.titleB')}</span>
              </h1>
              <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-(--muted-strong) md:mt-7 md:text-[19px] md:leading-relaxed">
                {t('hero.description')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="inline-flex items-center gap-2 rounded-sm bg-(--signal) px-4 py-2.5 text-sm font-semibold text-(--on-signal) transition-opacity hover:opacity-85">
                  {t('hero.primary')} <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px] sm:flex sm:flex-wrap sm:gap-2 sm:font-mono sm:text-[11px] md:mt-5">
                <Link href="/blog" className="min-w-0 whitespace-nowrap rounded-full border border-(--border) bg-(--surface) px-1 py-1 text-(--muted-strong) hover:border-(--signal) sm:px-2.5">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</Link>
                <Link href="#trust" className="min-w-0 whitespace-nowrap rounded-full border border-(--border) bg-(--surface) px-1 py-1 text-(--muted-strong) hover:border-(--signal) sm:px-2.5"><span className="sm:hidden">{t('hero.badges.verifiedShort')}</span><span className="hidden sm:inline">{t('hero.badges.verified')}</span></Link>
                <span className="min-w-0 whitespace-nowrap rounded-full border border-(--border) bg-(--surface) px-1 py-1 text-(--muted-strong) sm:px-2.5">{t('hero.badges.reading')}</span>
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

        <section id="trust" className="scroll-mt-16 border-b border-(--border)">
          <TrustBand
            posts={posts}
            labels={{
              title: t('trust.title'), description: t('trust.description'),
              signalsLabel: t('trust.signalsLabel', { count: posts.length }),
              publicationLabel: t('trust.publicationLabel'), publicationTooltip: t('trust.publicationTooltip'),
              verifiableLabel: t('trust.verifiableLabel'), verifiableTooltip: t('trust.verifiableTooltip'),
              topicsLabel: t('trust.topicsLabel', { count: topicCount }),
            }}
          />
        </section>

        <section id="process" className="border-b border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-12 lg:py-16">
            <div className="space-y-7">
              <div>
                <p className="eyebrow mb-4">{t('process.eyebrow')}</p>
                <h2 className="section-heading max-w-md">{t('process.title')}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--muted)">{t('process.description')}</p>
              </div>
              <PathTrail steps={[0, 1, 2, 3, 4].map((index) => ({
                title: t(`process.steps.${index}`),
                description: t(`process.details.${index}`),
              }))} />
            </div>
          </div>
        </section>

        <section id="topics" className="border-y border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-12 lg:py-16">
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

        <section className="page-shell py-12 lg:py-16">
          <CreatorCard labels={{
            eyebrow: t('about.creatorEyebrow'),
            title: t('about.creatorTitle'),
            body: <>{t('homeCreator.body')} <Link href={aboutPath} className="font-semibold text-(--signal) hover:underline">{t('homeCreator.readMore')}</Link></>,
          }} />
        </section>

        <section className="page-shell pb-12 pt-6 lg:pb-16 lg:pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <h2 className="section-heading max-w-md">
                {t('explore.title')}
              </h2>
            </div>
            <div>
              <div className="grid gap-px border-y border-(--border) bg-(--border) sm:grid-cols-3">
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
