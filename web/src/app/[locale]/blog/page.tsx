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
  searchParams: Promise<{ q?: string; topic?: string }>
}) {
  const { locale } = await params
  const { q, topic: topicParam } = await searchParams

  if (locale !== 'pt-BR') {
    redirect('/blog')
  }

  const t = await getTranslations()
  const posts = await listPosts()
  const topicResult = topicParam ? topicSchema.safeParse(topicParam) : null
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
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <div className="eyebrow">{t('blog.eyebrow')}</div>
            <h1 className="mt-5 max-w-md text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('blog.title')}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-(--muted)">
              {t('blog.description')}
            </p>
            <div className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-(--muted)">
              <span className="signal-dot" />
              {t('blog.signalsPublished', { count: posts.length })}
            </div>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={undefined}
            labels={{
              searchPlaceholder: t('console.searchPlaceholder'),
              allTopics: t('console.allTopics'),
              countLabelOne: t('console.countLabelOne'),
              countLabelOther: t('console.countLabelOther'),
              loadMore: t('console.loadMore'),
              empty: t('console.empty'),
              signalFallback: t('console.signalFallback'),
            }}
            topicMeta={topicMeta}
            initialTopic={topicResult?.success ? (topicResult.data as Topic) : undefined}
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
