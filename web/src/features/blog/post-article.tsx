import { TrackedLink } from '@/analytics/tracked-link'
import { formatCompactDate, formatDate } from '@/lib/date'
import { sourceStatusLabelKey } from '@/lib/source-verification'
import { getTopicMeta } from '@/lib/topics'
import type { Post, PostSummary } from '@nexsift/schemas/post'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Breadcrumbs } from './breadcrumbs'
import { EditorialLink } from './editorial-link'

export async function PostArticle({
  post,
  relatedPosts,
}: {
  post: Post
  relatedPosts: PostSummary[]
}) {
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
        items={[
          ...breadcrumbs,
          ...(topicCrumb ? [topicCrumb] : []),
          { label: post.title },
        ]}
        topic={primaryTopic}
      />
      <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,52rem)_minmax(15rem,1fr)] lg:gap-16">
        <div className="min-w-0">
          {primaryTopic && topicLabel ? (
            <div
              data-topic={primaryTopic}
              className="topic-color flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-(--topic-color)"
            >
              <span className="h-px w-6 bg-(--topic-color)" />
              {topicLabel}
              <span className="text-(--muted)">
                · {t(`signalTypes.${post.signalType}`)}
              </span>
              <span className="text-(--muted)">· {formatDate(post.publishedAt)}</span>
            </div>
          ) : null}

          <h1 className="mt-7 max-w-4xl text-[clamp(2.5rem,6vw,5.3rem)] font-medium leading-[0.96] tracking-[-0.065em]">
            {post.title}
          </h1>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted)">
            {t('article.published')} {formatDate(post.publishedAt)}
            {post.updatedAt
              ? ` · ${t('article.updated')} ${formatDate(post.updatedAt)}`
              : ''}
            {' · '}
            {t('article.reading')} {post.readingTime} {t('blog.minutes')}
            {' · '}
            {t('article.relevance')} {post.relevanceScore.toFixed(1)}
          </p>

          <div className="my-10 h-px bg-(--border)" />

          <section>
            <div className="eyebrow text-(--signal)">{t('blog.whatChanged')}</div>
            <p className="mt-4 text-lg leading-relaxed text-(--muted-strong) md:text-xl">
              {post.description}
            </p>
          </section>

          <section className="mt-12 border border-(--border) bg-(--signal-soft) p-6 md:p-8">
            <div className="eyebrow text-(--signal)">{t('blog.why')}</div>
            <p className="mt-4 text-lg leading-relaxed text-(--foreground)">
              {post.whyItMatters}
            </p>
          </section>

          <div className="prose-nexsift mt-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ a: EditorialLink }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {post.whatToWatch ? (
            <section className="mt-14 border border-(--border) bg-(--surface) p-6 md:p-8">
              <div className="eyebrow text-(--signal)">{t('blog.whatToWatch')}</div>
              <p className="mt-4 text-lg leading-relaxed text-(--foreground)">
                {post.whatToWatch}
              </p>
            </section>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="mt-14 border-t border-(--border) pt-8">
              <div className="eyebrow text-(--signal)">
                {t('blog.continueOnRadar')}
              </div>
              <div className="mt-5">
                {relatedPosts.map((related, index) => {
                  const relatedTopic = related.topics[0]

                  return (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      data-topic={relatedTopic}
                      className="topic-color group flex items-center gap-4 border-b border-(--border) py-3.5 last:border-b-0"
                    >
                      <span className="font-mono text-[10px] text-(--muted)">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="h-px w-4 shrink-0 bg-(--topic-color)" />
                      <span className="min-w-0 flex-1 truncate text-sm text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                        {related.title}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted)">
                        {formatCompactDate(related.publishedAt)}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 text-(--muted)"
                        strokeWidth={1.7}
                      />
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-t border-(--border) pt-4">
            <div className="eyebrow text-(--signal)">{t('blog.sources')}</div>
            <div className="mt-5 space-y-3">
              {post.sources.map((source, index) => {
                const statusKey = sourceStatusLabelKey(source)

                return (
                  <TrackedLink
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                    {statusKey !== 'unknown' ? (
                      <span className="mt-2 inline-flex font-mono text-[9px] uppercase tracking-widest text-(--muted)">
                        {t(`article.sourceStatus.${statusKey}`)}
                      </span>
                    ) : null}
                  </TrackedLink>
                )
              })}
            </div>
            <p className="mt-5 font-mono text-[10px] leading-relaxed text-(--muted)">
              {t('notice.sources')}
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
