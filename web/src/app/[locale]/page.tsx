import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { ProcessLine } from '@/features/landing/process-line'
import { RadarPanel } from '@/features/landing/radar-panel'
import { StatsBand } from '@/features/landing/stats-band'
import { TopicBands } from '@/features/landing/topic-bands'
import { routing, type AppLocale } from '@/i18n/routing'
import { listPosts } from '@/lib/content'
import { compareByLatestUpdate } from '@/lib/date'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

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
  const homePath = locale === 'pt-BR' ? '/' : `/${locale}`

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
          <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.14]" />
          <div className="page-shell relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-24">
            <div>
              <div className="eyebrow flex items-center gap-3">
                <span className="signal-dot" />
                {t('hero.eyebrow')}
              </div>
              <h1 className="mt-8 max-w-5xl text-[clamp(4rem,9vw,9rem)] font-medium leading-[0.82] tracking-[-0.085em]">
                <span className="block">{t('hero.titleA')}</span>
                <span className="block text-(--signal)">{t('hero.titleB')}</span>
              </h1>
              <p className="mt-9 max-w-2xl text-[clamp(1rem,1.7vw,1.28rem)] leading-relaxed text-(--muted-strong)">
                {t('hero.description')}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-sm bg-(--signal) px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  {t('hero.primary')}
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

            <RadarPanel posts={posts} />
          </div>
        </section>

        <section id="signals" className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="eyebrow">{t('latest.eyebrow')}</div>
              <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                {t('latest.title')}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                {t('latest.description')}
              </p>
            </div>
            <SignalLedger posts={posts} limit={5} />
          </div>
        </section>

        <section className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="eyebrow">{t('recentlyUpdated.eyebrow')}</div>
              <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                {t('recentlyUpdated.title')}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                {t('recentlyUpdated.description')}
              </p>
            </div>
            <SignalLedger
              posts={[...posts].sort(compareByLatestUpdate).slice(0, 5)}
            />
          </div>
        </section>

        <section id="topics" className="border-y border-(--border) bg-(--surface-soft)">
          <div className="page-shell py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <div className="eyebrow">{t('topics.eyebrow')}</div>
                <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                  {t('topics.title')}
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                  {t('topics.description')}
                </p>
              </div>
              <TopicBands posts={posts} />
            </div>
          </div>
        </section>

        <section id="process" className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="eyebrow">{t('process.eyebrow')}</div>
              <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                {t('process.title')}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                {t('process.description')}
              </p>
            </div>
            <ProcessLine
              steps={[
                t('process.research'),
                t('process.filter'),
                t('process.verify'),
                t('process.context'),
                t('process.publish'),
              ]}
            />
          </div>
        </section>

        <section className="page-shell py-20 lg:py-28">
          <StatsBand
            signals={posts.length}
            frequencies={new Set(posts.flatMap((post) => post.topics)).size}
            avgRelevance={
              posts.length > 0
                ? (
                  posts.reduce((sum, post) => sum + post.relevanceScore, 0) /
                  posts.length
                ).toFixed(1)
                : '0.0'
            }
            labels={{
              signals: t('stats.signals'),
              frequencies: t('stats.frequencies'),
              avgRelevance: t('stats.avgRelevance'),
            }}
          />
        </section>

        <section className="border-t border-(--border) bg-(--surface)">
          <div className="page-shell grid gap-8 py-20 lg:grid-cols-[0.65fr_1.35fr] lg:py-28">
            <div className="eyebrow text-(--signal)">{t('trust.eyebrow')}</div>
            <div>
              <h2 className="max-w-4xl text-[clamp(2.8rem,6vw,6rem)] font-medium leading-[0.96] tracking-[-0.065em]">
                {t('trust.title')}
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-(--muted-strong)">
                {t('trust.description')}
              </p>
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
