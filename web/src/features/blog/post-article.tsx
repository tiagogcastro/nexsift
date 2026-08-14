import { TrackedLink } from '@/analytics/tracked-link'
import { formatCompactDate, formatDate } from '@/lib/date'
import { isSignalWithinDays } from '@/lib/recency'
import { sourceStatusLabelKey } from '@/lib/source-verification'
import { getTopicMeta } from '@/lib/topics'
import { topicIcons } from '@/lib/topic-icons'
import { siteConfig } from '@/config/site'
import type { Post, PostSummary } from '@nexsift/schemas/post'
import { ArrowUpRight, Clock, Link2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ImgHTMLAttributes } from 'react'
import { Breadcrumbs } from './breadcrumbs'
import { EditorialLink } from './editorial-link'

const NEW_BADGE_DAYS = 5

function InlineArticleImage({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="my-10 max-h-[75vh] w-full border border-(--border) bg-(--surface) object-contain"
    />
  )
}

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
  const TopicIcon = primaryTopic ? topicIcons[primaryTopic] : null
  const isNew = isSignalWithinDays(post.publishedAt, NEW_BADGE_DAYS)
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
              className="topic-color flex flex-wrap items-center gap-2"
            >
              <span className="topic-chip">
                {TopicIcon ? (
                  <TopicIcon size={11} strokeWidth={2} className="text-(--topic-color)" />
                ) : null}
                {topicLabel}
              </span>
              {isNew ? (
                <span className="rounded-(--radius-sm) bg-(--signal) px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-black">
                  {t('radar.newBadge')}
                </span>
              ) : null}
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

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-(--border) py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted)">
            <span>{t('article.byline')}</span>
            <a
              href={siteConfig.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-(--foreground) transition-colors hover:text-(--signal)"
            >
              {siteConfig.creator}
            </a>
            <span>{t('article.bylineRole')}</span>
            <span>·</span>
            <span>{siteConfig.name} Editorial</span>
          </div>

          {post.coverImage ? (
            <figure className="mt-10 border border-(--border) bg-(--surface)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/s3/${post.coverImage.objectKey}`}
                alt={post.coverImage.alt}
                className="max-h-[75vh] w-full object-contain"
              />
              {post.coverImage.caption ? (
                <figcaption className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted)">
                  {post.coverImage.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <section className="mt-10">
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
              components={{ a: EditorialLink, img: InlineArticleImage }}
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
            <section className="mt-14 border-t border-(--border) pt-10">
              <div className="eyebrow text-(--signal)">
                {t('blog.continueOnRadar')}
              </div>
              <div className="mt-6">
                {relatedPosts.map((related, index) => {
                  const relatedTopic = related.topics[0]
                  const relatedLabel = relatedTopic
                    ? getTopicMeta(t, relatedTopic).label
                    : null
                  const RelatedIcon = relatedTopic
                    ? topicIcons[relatedTopic]
                    : null

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
                      <span className="hidden shrink-0 sm:block">
                        <span className="topic-chip">
                          {RelatedIcon ? (
                            <RelatedIcon
                              size={11}
                              strokeWidth={2}
                              className="text-(--topic-color)"
                            />
                          ) : null}
                          {relatedLabel ?? t('console.signalFallback')}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                        {related.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted-strong)">
                        <Link2 size={10} className="text-(--signal)" />
                        {related.sources.length}
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
          <div className="border border-(--border) bg-(--surface-soft) p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="eyebrow text-(--signal)">{t('blog.sources')}</div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--signal)">
                <Link2 size={11} strokeWidth={2.2} />
                {post.sources.length}
              </span>
            </div>
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
                    className="group block border border-(--border) bg-(--surface) p-3 transition-colors hover:border-(--border-strong)"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-widest text-(--muted)">
                      <span className="flex items-center gap-2">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-(--muted-strong)">{source.publisher}</span>
                      </span>
                      {statusKey !== 'unknown' ? (
                        <span
                          data-status={statusKey}
                          className="source-status inline-flex items-center gap-1 rounded-(--radius-sm) border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest"
                        >
                          {t(`article.sourceStatus.${statusKey}`)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2.5 flex items-start gap-2 text-sm leading-snug text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                      <span>{source.title}</span>
                      <ArrowUpRight size={13} className="mt-0.5 shrink-0" />
                    </div>
                  </TrackedLink>
                )
              })}
            </div>
            <p className="mt-4 flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-(--muted)">
              <Clock size={11} className="mt-0.5 shrink-0" />
              {t('notice.sources')}
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}