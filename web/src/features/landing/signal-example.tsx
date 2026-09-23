import type { Post } from '@nexsift/schemas/post'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface ExampleLabels {
  eyebrow: string
  title: string
  description: string
  source: string
  summary: string
  why: string
  read: string
  openSource: string
}

export function SignalExample({ post, labels }: { post: Post; labels: ExampleLabels }) {
  const source = post.sources[0]

  if (!source) return null

  return (
    <section className="border-b border-(--border)">
      <div className="page-shell py-16 lg:py-24">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h2 className="section-heading mt-4 max-w-3xl">
          {labels.title}
        </h2>
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-(--muted)">
          {labels.description}
        </p>

        <div className="mt-10 grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1.1fr)] lg:gap-6">
          <div className="flex min-w-0 flex-col border border-(--border) bg-(--surface-soft) p-5 md:p-6">
            <span className="eyebrow">{labels.source}</span>
            <p className="mt-6 font-mono text-xs text-(--muted)">{source.publisher}</p>
            <h3 className="mt-2 text-base font-medium leading-snug text-(--foreground)">{source.title}</h3>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm text-(--muted-strong) underline decoration-(--border-strong) underline-offset-4 hover:text-(--signal)"
            >
              {labels.openSource} <ArrowUpRight size={14} />
            </a>
          </div>

          <svg
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
            className="mx-auto size-12 rotate-90 lg:my-auto lg:size-20 lg:rotate-0"
          >
            <path d="M3 40h20m4 0h11m4 0h11m4 0h20" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="3 4" />
            <rect x="28" y="24" width="24" height="32" rx="4" fill="var(--surface)" stroke="var(--signal)" />
            <path d="m35 40 4 4 7-9" stroke="var(--signal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m68 34 9 6-9 6" stroke="var(--signal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="min-w-0 border-l-2 border-(--signal) bg-(--surface) p-5 md:p-6">
            <span className="eyebrow text-(--signal)">{labels.summary}</span>
            <h3 className="mt-5 text-lg font-medium leading-snug tracking-[-0.025em]">{post.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--muted-strong)">{post.description}</p>
            <div className="mt-5 border-t border-(--border) pt-4">
              <span className="eyebrow">{labels.why}</span>
              <p className="mt-2 text-sm leading-relaxed text-(--muted-strong)">{post.whyItMatters}</p>
            </div>
            <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-(--signal) hover:text-(--foreground)">
              {labels.read} <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
