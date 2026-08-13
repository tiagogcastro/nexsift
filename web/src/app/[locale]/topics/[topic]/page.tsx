import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import { signalTypeSchema, type SignalType } from '@nexsift/schemas/signal-type'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Breadcrumbs } from '@/features/blog/breadcrumbs'
import { LedgerConsole } from '@/features/blog/ledger-console'
import { listPostsByTopic } from '@/lib/content'
import { getTopicMeta, topicOrder } from '@/lib/topics'

export const dynamic = 'force-dynamic'

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; topic: string }>
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { locale, topic: rawTopic } = await params
  const { q, type: typeParam } = await searchParams

  if (locale !== 'pt-BR') {
    redirect(`/topics/${rawTopic}`)
  }

  const result = topicSchema.safeParse(rawTopic)

  if (!result.success) {
    notFound()
  }

  const topic = result.data as Topic
  const posts = await listPostsByTopic(topic)
  const t = await getTranslations()
  const meta = getTopicMeta(t, topic)
  const topicMeta = Object.fromEntries(
    topicOrder.map((topicKey) => {
      const topicKeyMeta = getTopicMeta(t, topicKey)

      return [topicKey, { label: topicKeyMeta.label, shortLabel: topicKeyMeta.shortLabel }]
    }),
  ) as Record<Topic, { label: string; shortLabel: string }>
  const typeResult = typeParam ? signalTypeSchema.safeParse(typeParam) : null
  const typeMeta = Object.fromEntries(
    signalTypeSchema.options.map((type) => [type, t(`signalTypes.${type}`)]),
  ) as Record<SignalType, string>

  return (
    <>
      <Header
        locale="pt-BR"
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div data-topic={topic} className="topic-color lg:sticky lg:top-24 lg:self-start">
            <Breadcrumbs
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.topics'), href: '/topics' },
                { label: meta.label },
              ]}
              topic={topic}
            />
            <div className="eyebrow text-(--topic-color)">
              {t('topicPage.frequency')} / {meta.shortLabel}
            </div>
            <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('topicPage.radarTitle', { topic: meta.label })}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-(--muted)">
              {meta.description}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-(--topic-color)">
              {t('topicPage.signalCount', { count: posts.length })}
            </p>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={topic}
            labels={{
              searchPlaceholder: t('console.searchPlaceholder'),
              allTopics: t('console.allTopics'),
              allTypes: t('console.allTypes'),
              countLabelOne: t('console.countLabelOne'),
              countLabelOther: t('console.countLabelOther'),
              loadMore: t('console.loadMore'),
              empty: t('console.empty'),
              signalFallback: t('console.signalFallback'),
              relevanceLabel: t('article.relevance'),
              newLabel: t('radar.newBadge'),
              sourcesLabel: t('radar.sourcesCount', { count: 1 }),
            }}
            topicMeta={topicMeta}
            typeLabels={typeMeta}
            initialTopic={topic}
            initialType={typeResult?.success ? (typeResult.data as SignalType) : undefined}
            initialQuery={q}
          />
        </div>
      </main>
      <Footer
        locale="pt-BR"
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
