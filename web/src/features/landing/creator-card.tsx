import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { siteConfig } from '@/config/site'

export interface CreatorCardLabels {
  eyebrow: string
  title: string
  body: ReactNode
}

export function CreatorCard({ labels }: { labels: CreatorCardLabels }) {
  return (
    <div className="relative overflow-hidden border border-(--border) bg-(--surface-soft) p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-(--radius-sm) border border-(--border-strong) bg-(--surface-raised) font-mono text-sm font-semibold text-(--signal)">
            TC
          </div>
          <div>
            <div className="eyebrow text-(--signal)">{labels.eyebrow}</div>
            <div className="mt-1 text-lg font-medium tracking-[-0.03em]">
              {labels.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-(--muted-strong)">
          <a
            href={siteConfig.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-(--signal)"
          >
            LinkedIn <ArrowUpRight size={13} />
          </a>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-(--signal)"
          >
            GitHub <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <p className="mt-6 max-w-[56ch] text-sm leading-relaxed text-(--muted-strong)">
        {labels.body}
      </p>
    </div>
  )
}