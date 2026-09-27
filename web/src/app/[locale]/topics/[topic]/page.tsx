import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Breadcrumbs } from '@/features/blog/breadcrumbs'
import { LedgerConsole } from '@/features/blog/ledger-console'
import { listPostsByTopic } from '@/lib/content'
import { getTopicMeta, topicOrder } from '@/lib/topics'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; topic: string }> }): Promise<Metadata> {
  const { locale, topic } = await params
  const parsed = topicSchema.safeParse(topic)
  if (locale !== 'pt-BR' || !parsed.success) return {}
  const t = await getTranslations({ locale })
  const label = getTopicMeta(t, parsed.data).label
  return {
    title: t('topicPage.metaTitle', { topic: label }),
    description: t('topicPage.metaDescription', { topic: label }),
    alternates: { canonical: `/topics/${topic}` },
    openGraph: { title: t('topicPage.metaTitle', { topic: label }), description: t('topicPage.metaDescription', { topic: label }), url: `/topics/${topic}`, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: t('topicPage.metaTitle', { topic: label }), description: t('topicPage.metaDescription', { topic: label }), images: ['/opengraph-image'] },
  }
}

export const dynamic = 'force-dynamic'

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; topic: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale, topic: rawTopic } = await params
  const { q } = await searchParams

  if (locale !== 'pt-BR') {
    redirect(`/topics/${rawTopic}`)
  }

  const result = topicSchema.safeParse(rawTopic)

  if (!result.success) {
    notFound()
  }

  const topic = result.data as Topic
  // Defense in depth: even if a topic index drifts, the page only ever shows
  // signals whose topic is this one.
  const posts = (await listPostsByTopic(topic)).filter(
    (post) => post.topic === topic,
  )
  const t = await getTranslations()
  const meta = getTopicMeta(t, topic)
  const topicMeta = Object.fromEntries(
    topicOrder.map((topicKey) => {
      const topicKeyMeta = getTopicMeta(t, topicKey)

      return [topicKey, { label: topicKeyMeta.label, shortLabel: topicKeyMeta.shortLabel }]
    }),
  ) as Record<Topic, { label: string; shortLabel: string }>

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
      <main className="page-shell min-h-[75vh] py-9 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-[0.55fr_1.45fr] lg:gap-12">
          <div data-topic={topic} className="topic-color lg:sticky lg:top-24 lg:self-start">
            <Breadcrumbs
              items={[
                { label: t('breadcrumb.blog'), href: '/blog' },
                { label: t('breadcrumb.topics'), href: '/topics' },
                { label: meta.label },
              ]}
              topic={topic}
            />
            <h1 className="page-heading max-w-xl">
              {meta.label}
            </h1>
            <p className="intro-copy mt-3 max-w-sm text-(--muted)">
              {meta.description}
            </p>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={topic}
            labels={{
              searchPlaceholder: t('console.searchPlaceholder'),
              allTopics: t('console.allTopics'),
              topicFilter: t('console.topicFilter'),
              selectedTopics: t('console.selectedTopics'),
              countLabelOne: t('console.countLabelOne'),
              countLabelOther: t('console.countLabelOther'),
              previous: t('console.previous'),
              next: t('console.next'),
              pageOf: t('console.pageOf'),
              empty: t('console.empty'),
              signalFallback: t('console.signalFallback'),
              relevanceLabel: t('article.relevance'),
              newLabel: t('radar.newBadge'),
              sourcesLabel: t('radar.sourcesCount', { count: 1 }),
              matchedTag: t('console.matchedTag'),
            }}
            topicMeta={topicMeta}
            initialTopics={[topic]}
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
