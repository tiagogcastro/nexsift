import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { listPostsByTopic } from '@/lib/content'
import { topicMeta } from '@/lib/topics'

export const dynamic = 'force-dynamic'

export default async function TopicPage({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>
}) {
  const { locale, topic: rawTopic } = await params

  if (locale !== 'pt-BR') {
    redirect(`/pt-BR/topics/${rawTopic}`)
  }

  const result = topicSchema.safeParse(rawTopic)

  if (!result.success) {
    notFound()
  }

  const topic = result.data as Topic
  const posts = await listPostsByTopic(topic)
  const meta = topicMeta[topic]
  const t = await getTranslations()

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
          <div data-topic={topic} className="topic-color lg:sticky lg:top-10 lg:self-start">
            <div className="eyebrow text-[var(--topic-color)]">FREQUENCY / {meta.shortLabel}</div>
            <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {meta.label}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              {meta.description}
            </p>
          </div>
          {posts.length > 0 ? (
            <SignalLedger posts={posts} />
          ) : (
            <div className="border-y border-[var(--border)] py-10 text-sm text-[var(--muted)]">
              Nenhum sinal publicado nesta frequência ainda.
            </div>
          )}
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
