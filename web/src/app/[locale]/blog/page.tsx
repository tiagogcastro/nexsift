import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { LedgerConsole } from '@/features/blog/ledger-console'
import { listPosts } from '@/lib/content'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('blog.metaTitle'),
    description: t('blog.metaDescription'),
    openGraph: { title: t('blog.metaTitle'), description: t('blog.metaDescription'), url: '/blog', images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: t('blog.metaTitle'), description: t('blog.metaDescription'), images: ['/opengraph-image'] },
    alternates: {
      canonical: '/blog',
    },
  }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
   searchParams: Promise<{ q?: string; topic?: string | string[] }>
}) {
  const { locale } = await params
  const { q, topic: topicParam } = await searchParams

  if (locale !== 'pt-BR') {
    redirect('/blog')
  }

  const t = await getTranslations()
  const posts = await listPosts()
  const requestedTopics = Array.isArray(topicParam) ? topicParam : topicParam ? [topicParam] : []
  const initialTopics = [...new Set(requestedTopics.flatMap((value) => {
    const result = topicSchema.safeParse(value)
    return result.success ? [result.data as Topic] : []
  }))]
  const topicMeta = Object.fromEntries(
    topicOrder.map((topic) => {
      const meta = getTopicMeta(t, topic)

      return [topic, { label: meta.label, shortLabel: meta.shortLabel }]
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
      <main className="page-shell min-h-[75vh] py-8 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-[0.55fr_1.45fr] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h1 className="page-heading max-w-md">
              {t('blog.title')}
            </h1>
            <p className="intro-copy mt-2 max-w-sm text-(--muted) lg:mt-4">
              {t('blog.description')}
            </p>
            <h2 className="sr-only">{t('nav.blog')}</h2>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={undefined}
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
            initialTopics={initialTopics}
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
