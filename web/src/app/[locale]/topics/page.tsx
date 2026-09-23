import { hasLocale } from 'next-intl'
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
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.45fr_1fr]">
          <div className="eyebrow">{t('topics.eyebrow')}</div>
          <div>
            <h1 className="page-heading max-w-5xl">
              {t('topics.title')}
            </h1>
            <p className="intro-copy mt-6 max-w-[64ch] text-(--muted-strong)">
              {t('topics.description')}
            </p>

            <div className="mt-10 border-t border-(--border)">
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
                    className="topic-color group grid grid-cols-[3rem_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-(--border) py-6 transition-colors hover:bg-(--topic-color)/[0.07] last:border-b-0 md:grid-cols-[5rem_minmax(0,1fr)_auto_auto]"
                  >
                    <span className="font-mono text-[11px] text-(--muted)">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <TopicIcon
                          size={16}
                          strokeWidth={2}
                          className="shrink-0 text-(--topic-color)"
                        />
                        <span className="text-base font-medium tracking-[-0.03em] text-(--topic-color)">
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 max-w-[56ch] text-sm text-(--muted)">
                        {meta.description}
                      </div>
                    </div>
                    <span className="topic-chip">
                      {t('topics.count', { count })}
                    </span>
                    <span className="grid size-8 place-items-center text-(--muted) transition-colors group-hover:text-(--topic-color)">
                      <ArrowUpRight size={16} />
                    </span>
                  </Link>
                )
              })}
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
