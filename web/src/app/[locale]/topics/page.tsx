import { hasLocale } from 'next-intl'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { routing, type AppLocale } from '@/i18n/routing'
import { listPosts } from '@/lib/content'
import { topicIcons } from '@/lib/topic-icons'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { localizedAlternates } from '@/lib/alternates'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale })
  return {
    title: t('topics.metaTitle'), description: t('topics.metaDescription'),
    alternates: localizedAlternates(locale as AppLocale, '/topics'),
    openGraph: { title: t('topics.metaTitle'), description: t('topics.metaDescription'), url: locale === 'pt-BR' ? '/topics' : `/${locale}/topics`, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: t('topics.metaTitle'), description: t('topics.metaDescription'), images: ['/opengraph-image'] },
  }
}

export const dynamic = 'force-dynamic'

export default async function TopicsPage({
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
  const localePath = locale === 'pt-BR' ? '' : `/${locale}`

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
      <main className="page-shell min-h-[70vh] py-9 lg:py-20">
        <div className="grid gap-7 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="eyebrow mb-4">{t('topics.eyebrow')}</div>
            <h1 className="page-heading max-w-5xl">
              {t('topics.title')}
            </h1>
            <p className="intro-copy mt-3 max-w-sm text-(--muted-strong)">
              {t('topics.description')}
            </p>
          </div>
          <div className="border-t border-(--border)">
              {topicOrder.map((topic, index) => {
                const meta = getTopicMeta(t, topic)
                const count = posts.filter((post) =>
                  post.topic === topic,
                ).length
                const TopicIcon = topicIcons[topic]

                return (
                  <Link
                    key={topic}
                    href={`${localePath}/topics/${topic}`}
                    data-topic={topic}
                    className="topic-color group flex min-w-0 items-center gap-3 border-b border-(--border) py-3.5 transition-colors hover:bg-(--topic-color)/[0.07] last:border-b-0 sm:gap-4 lg:py-4"
                  >
                    <span className="hidden w-7 shrink-0 font-mono text-[11px] text-(--muted) sm:block">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <TopicIcon
                          size={16}
                          strokeWidth={2}
                          className="shrink-0 text-(--topic-color)"
                        />
                        <span className="min-w-0 truncate text-base font-medium tracking-[-0.03em] text-(--topic-color) sm:text-lg">
                          <span className="sm:hidden">{topic === 'ai' ? meta.shortLabel : meta.label}</span><span className="hidden sm:inline">{meta.label}</span>
                        </span>
                      </div>
                      <div className="mt-1 hidden text-sm leading-snug text-(--muted) lg:block">
                        {meta.description}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-(--muted)">
                      {t('topics.count', { count })}
                    </span>
                    <span className="grid size-6 shrink-0 place-items-center text-(--muted) transition-colors group-hover:text-(--topic-color)">
                      <ArrowUpRight size={16} />
                    </span>
                  </Link>
                )
              })}
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
