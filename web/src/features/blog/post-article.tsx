import { ArrowUpRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Post } from '@nexsift/schemas/post'
import { TrackedLink } from '@/analytics/tracked-link'
import { formatDate } from '@/lib/date'
import { topicMeta } from '@/lib/topics'

export function PostArticle({
  post,
  labels,
}: {
  post: Post
  labels: {
    why: string
    sources: string
    minutes: string
    score: string
  }
}) {
  const primaryTopic = post.topics[0]

  return (
    <article className="page-shell py-12 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[13rem_minmax(0,48rem)_minmax(13rem,1fr)] lg:gap-12 xl:gap-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-t border-[var(--border)] pt-4">
            <div className="eyebrow">Signal metadata</div>
            <dl className="mt-5 space-y-5 font-mono text-[10px] uppercase tracking-[0.08em]">
              <Meta label="Publicado" value={formatDate(post.publishedAt)} />
              <Meta label="Leitura" value={`${post.readingTime} ${labels.minutes}`} />
              <Meta label={labels.score} value={`${post.relevanceScore.toFixed(1)} / 10`} />
              <Meta label="Autor" value="NexSift Editorial" />
            </dl>
          </div>
        </aside>

        <div className="min-w-0">
          {primaryTopic ? (
            <div
              data-topic={primaryTopic}
              className="topic-color mb-7 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--topic-color)]"
            >
              <span className="h-px w-6 bg-[var(--topic-color)]" />
              {topicMeta[primaryTopic].label}
            </div>
          ) : null}

          <h1 className="max-w-4xl text-[clamp(2.5rem,6vw,5.3rem)] font-medium leading-[0.96] tracking-[-0.065em]">
            {post.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-[var(--muted-strong)] md:text-xl">
            {post.description}
          </p>

          <div className="my-10 h-px bg-[var(--border)]" />

          <div className="prose-nexsift">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          <section className="mt-14 border border-[var(--border)] bg-[var(--signal-soft)] p-6 md:p-8">
            <div className="eyebrow text-[var(--signal)]">{labels.why}</div>
            <p className="mt-4 text-lg leading-relaxed text-[var(--foreground)]">
              {post.whyItMatters}
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-t border-[var(--border)] pt-4">
            <div className="eyebrow">{labels.sources}</div>
            <div className="mt-5 space-y-3">
              {post.sources.map((source, index) => (
                <TrackedLink
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  event="source_clicked"
                  properties={{ post: post.slug, publisher: source.publisher }}
                  className="group block border-b border-[var(--border)] pb-3"
                >
                  <div className="flex gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{source.publisher}</span>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm leading-snug text-[var(--muted-strong)] transition-colors group-hover:text-[var(--foreground)]">
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
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 normal-case tracking-normal text-[var(--muted-strong)]">{value}</dd>
    </div>
  )
}
