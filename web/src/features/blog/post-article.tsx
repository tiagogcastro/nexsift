import { TrackedLink } from '@/analytics/tracked-link'
import { formatDate } from '@/lib/date'
import { getTopicMeta } from '@/lib/topics'
import type { Post } from '@nexsift/schemas/post'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Breadcrumbs } from './breadcrumbs'

export async function PostArticle({ post }: { post: Post }) {
  const t = await getTranslations()
  const primaryTopic = post.topics[0]
  const topicLabel = primaryTopic ? getTopicMeta(t, primaryTopic).label : null
  const breadcrumbs = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.blog'), href: '/blog' },
  ]
  const topicCrumb = primaryTopic
    ? { label: topicLabel ?? '', href: `/topics/${primaryTopic}` }
    : null

  return (
    <article className="page-shell py-12 lg:py-20">
      <Breadcrumbs
        items={[...breadcrumbs, ...(topicCrumb ? [topicCrumb] : []), { label: post.title }]}
        topic={primaryTopic}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-[13rem_minmax(0,48rem)_minmax(13rem,1fr)] lg:gap-12 xl:gap-16">
        <aside className="order-3 lg:order-0 lg:sticky lg:top-24 lg:self-start">
          <div className="border-t border-(--border) pt-4">
            <div className="eyebrow">{t('article.metadata')}</div>
            <dl className="mt-5 space-y-5 font-mono text-[10px] uppercase tracking-[0.08em]">
              <Meta label={t('article.published')} value={formatDate(post.publishedAt)} />
              {post.updatedAt ? (
                <Meta label={t('article.updated')} value={formatDate(post.updatedAt)} />
              ) : null}
              <Meta
                label={t('article.reading')}
                value={`${post.readingTime} ${t('blog.minutes')}`}
              />
              <Meta
                label={t('blog.score')}
                value={`${post.relevanceScore.toFixed(1)} / 10`}
              />
              <Meta label={t('article.author')} value={t('article.authorValue')} />
            </dl>
          </div>
          <p className="mt-8 border-t border-(--border) pt-4 font-mono text-[10px] leading-relaxed text-(--muted)">
            {t('notice.article')}
          </p>
        </aside>

        <div className="order-first min-w-0 lg:order-0">
          {primaryTopic && topicLabel ? (
            <div
              data-topic={primaryTopic}
              className="topic-color mb-7 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-(--topic-color)"
            >
              <span className="h-px w-6 bg-(--topic-color)" />
              {topicLabel}
            </div>
          ) : null}

          <h1 className="max-w-4xl text-[clamp(2.5rem,6vw,5.3rem)] font-medium leading-[0.96] tracking-[-0.065em]">
            {post.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-(--muted-strong) md:text-xl">
            {post.description}
          </p>

          <div className="my-10 h-px bg-(--border)" />

          <div className="prose-nexsift">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          <section className="mt-14 border border-(--border) bg-(--signal-soft) p-6 md:p-8">
            <div className="eyebrow text-(--signal)">{t('blog.why')}</div>
            <p className="mt-4 text-lg leading-relaxed text-(--foreground)">
              {post.whyItMatters}
            </p>
          </section>
        </div>

        <aside className="order-2 lg:order-0 lg:sticky lg:top-24 lg:self-start">
          <div className="border-t border-(--border) pt-4">
            <div className="eyebrow">{t('blog.sources')}</div>
            <div className="mt-5 space-y-3">
              {post.sources.map((source, index) => (
                <TrackedLink
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  event="source_clicked"
                  properties={{ post: post.slug, publisher: source.publisher }}
                  className="group block border-b border-(--border) pb-3"
                >
                  <div className="flex gap-2 font-mono text-[9px] uppercase tracking-widest text-(--muted)">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{source.publisher}</span>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm leading-snug text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                    <span>{source.title}</span>
                    <ArrowUpRight size={13} className="mt-0.5 shrink-0" />
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-(--muted)">{label}</dt>
      <dd className="mt-1 normal-case tracking-normal text-(--muted-strong)">{value}</dd>
    </div>
  )
}
