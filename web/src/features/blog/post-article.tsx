import { TrackedLink } from '@/analytics/tracked-link'
import { formatCompactDate, formatShortDate } from '@/lib/date'
import { isSignalWithinDays } from '@/lib/recency'
import { sourceDisplayTitle, sourceStatusLabelKey } from '@/lib/source-verification'
import { getTopicMeta } from '@/lib/topics'
import { topicIcons } from '@/lib/topic-icons'
import { siteConfig } from '@/config/site'
import type { Post, PostSummary } from '@nexsift/schemas/post'
import { ArrowUpRight, CheckCircle2, CircleAlert, Clock, Link2 } from 'lucide-react'
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
      className="my-12 max-h-[78vh] w-full border border-(--border) bg-(--surface-soft) object-contain"
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
  const topic = post.topic
  const topicLabel = getTopicMeta(t, topic).label
  const isNew = isSignalWithinDays(post.publishedAt, NEW_BADGE_DAYS)
  const breadcrumbs = [
    { label: t('breadcrumb.blog'), href: '/blog' },
  ]
  const topicCrumb = { label: topicLabel, href: `/topics/${topic}` }

  return (
    <article className="page-shell py-12 lg:py-20">
      <Breadcrumbs
        items={[
          ...breadcrumbs,
          topicCrumb,
        ]}
        topic={topic}
        topicChip
        badge={isNew ? t('radar.newBadge') : undefined}
      />
      <div className="mt-3 grid gap-10 lg:grid-cols-[minmax(0,52rem)_minmax(15rem,1fr)] lg:gap-14">
        <div className="min-w-0">
          <h1 className="max-w-4xl text-[clamp(1.55rem,3vw,2.85rem)] font-medium leading-[1.12] tracking-[-0.03em]">
            {post.title}
          </h1>

          <div
            role="region"
            aria-label={t('article.metadata')}
            tabIndex={0}
            className="mt-3 overflow-x-auto border-y border-(--border) sm:mt-4"
          >
            <div className="flex w-max min-w-full items-center gap-x-1.5 whitespace-nowrap py-2 font-mono text-[10px] text-(--muted) sm:gap-x-2 sm:text-[11px]">
              <time dateTime={post.publishedAt} aria-label={`${t('article.published')} ${formatShortDate(post.publishedAt)}`}>
                {formatShortDate(post.publishedAt)}
              </time>
              {post.updatedAt ? (
                <span>· {t('article.updated')} {formatShortDate(post.updatedAt)}</span>
              ) : null}
              <span>· {post.readingTime} min</span>
              <span>· {t('article.relevance')} {post.relevanceScore.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span>· {t('article.byline')}</span>
              <a
                href={siteConfig.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-(--foreground) transition-colors hover:text-(--signal)"
              >
                {siteConfig.creator}
              </a>
              <span>· {siteConfig.name}</span>
            </div>
          </div>

          {post.coverImage ? (
            <figure className="mt-8 border border-(--border) bg-(--surface)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/s3/${post.coverImage.objectKey}`}
                alt={post.coverImage.alt}
                className="max-h-[75vh] w-full object-contain"
              />
              {post.coverImage.caption ? (
                <figcaption className="max-w-[62ch] px-4 py-3 font-mono text-[11px] tracking-[0.04em] text-(--muted)">
                  {post.coverImage.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <section className="mt-8">
            <div className="eyebrow text-(--signal)">{t('blog.whatChanged')}</div>
            <p className="mt-2 max-w-[68ch] text-sm leading-[1.55] text-(--muted-strong) md:text-base">
              {post.description}
            </p>
          </section>

          <section className="mt-8 border border-(--border) bg-(--signal-soft) p-4 md:p-5">
            <div className="eyebrow text-(--signal)">{t('blog.why')}</div>
            <p className="mt-2 max-w-[68ch] text-sm leading-[1.55] text-(--foreground) md:text-base">
              {post.whyItMatters}
            </p>
          </section>

          <div className="prose-nexsift mt-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ a: EditorialLink, img: InlineArticleImage }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {post.whatToWatch ? (
            <section className="mt-10 border border-(--border) bg-(--surface-raised) p-4 md:p-5">
              <div className="eyebrow text-(--signal)">{t('blog.whatToWatch')}</div>
              <p className="mt-2 max-w-[68ch] text-sm leading-[1.55] text-(--foreground) md:text-base">
                {post.whatToWatch}
              </p>
            </section>
          ) : null}

          {post.relatedTopics.length > 0 ? (
            <section className="mt-14 border-t border-(--border) pt-10">
              <div className="eyebrow text-(--signal)">
                {t('article.relatedTopics')}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.relatedTopics.map((relatedTopic) => {
                  const RelatedIcon = topicIcons[relatedTopic]

                  return (
                    <Link
                      key={relatedTopic}
                      href={`/topics/${relatedTopic}`}
                      data-topic={relatedTopic}
                      className="topic-color flex items-center gap-1.5 rounded-(--radius-sm) border border-(--border-strong) bg-(--surface) px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--muted-strong) transition-colors hover:border-(--topic-color) hover:text-(--topic-color)"
                    >
                      <RelatedIcon size={13} strokeWidth={2} className="text-(--topic-color)" />
                      {getTopicMeta(t, relatedTopic).label}
                      <ArrowUpRight size={12} className="text-(--muted)" />
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="mt-14 border-t border-(--border) pt-10">
              <div className="eyebrow text-(--signal)">
                {t('blog.continueOnRadar')}
              </div>
              <p className="mt-2 text-sm text-(--muted)">{t('blog.continueOnRadarDescription')}</p>
              <div className="mt-6">
                {relatedPosts.map((related, index) => {
                  const relatedLabel = getTopicMeta(t, related.topic).label
                  const RelatedIcon = topicIcons[related.topic]

                  return (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      data-topic={related.topic}
                      className="topic-color group flex flex-wrap items-center gap-2 border-b border-(--border) py-3.5 last:border-b-0 sm:gap-4"
                    >
                      <span className="font-mono text-[11px] text-(--muted)">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="shrink-0">
                        <span className="topic-chip">
                          <RelatedIcon
                            size={11}
                            strokeWidth={2}
                            className="text-(--topic-color)"
                          />
                          {relatedLabel}
                        </span>
                      </span>
                      <span className="w-full min-w-0 text-sm text-(--muted-strong) transition-colors group-hover:text-(--foreground) sm:w-auto sm:flex-1 sm:truncate">
                        {related.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.08em] text-(--muted-strong)">
                        <Link2 size={10} className="text-(--signal)" />
                        {related.sources.length}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-(--muted) sm:ml-0">
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
          <div className="border border-(--border) bg-(--surface-soft) p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="eyebrow text-(--signal)">{t('blog.sources')}</div>
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--signal)">
                <Link2 size={11} strokeWidth={2.2} />
                {post.sources.length}
              </span>
            </div>
            <div className="mt-4 divide-y divide-(--border) border-y border-(--border)">
              {post.sources.map((source) => {
                const statusKey = sourceStatusLabelKey(source)
                const StatusIcon = ['healthy', 'redirected', 'replaced'].includes(statusKey)
                  ? CheckCircle2
                  : CircleAlert

                return (
                    <TrackedLink
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('article.openSourceAria', {
                        title: sourceDisplayTitle(source.title, source.publisher),
                      })}
                      event="source_clicked"
                      properties={{ post: post.slug, publisher: source.publisher }}
                      className="group flex flex-col gap-2 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-4 rounded-sm transition-colors hover:bg-(--surface) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--signal)"
                    >
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-semibold leading-snug text-(--foreground) group-hover:text-(--signal)">
                          {sourceDisplayTitle(source.title, source.publisher)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] text-(--muted)">
                          <span>{source.publisher}</span>
                          {statusKey !== 'unknown' ? (
                            <>
                              <span aria-hidden>·</span>
                              <span
                                data-status={statusKey}
                                aria-label={t('article.sourceStatusAria', {
                                  status: t(`article.sourceStatus.${statusKey}`),
                                })}
                                className="source-status inline-flex items-center gap-1 rounded-(--radius-sm) px-1 py-0.5"
                              >
                                <StatusIcon size={11} aria-hidden />
                                {t(`article.sourceStatus.${statusKey}`)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 self-start font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-(--signal) group-hover:underline sm:self-center">
                          {t('article.openSource')}
                        <ArrowUpRight size={12} aria-hidden />
                      </span>
                    </TrackedLink>
                  )
                })}
            </div>
            <p className="mt-3 flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-(--muted)">
              <Clock size={11} className="mt-0.5 shrink-0" />
              {t('notice.sources')}
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
