import { getTranslations } from 'next-intl/server'
import type { PostSummary } from '@nexsift/schemas/post'
import { getTopicMeta } from '@/lib/topics'
import { LedgerRow } from './ledger-row'

export async function SignalLedger({
  posts,
  limit,
  compact = false,
}: {
  posts: PostSummary[]
  limit?: number
  compact?: boolean
}) {
  const t = await getTranslations()
  const visiblePosts = typeof limit === 'number' ? posts.slice(0, limit) : posts

  return (
    <div>
      {visiblePosts.map((post, index) => {
        const label = getTopicMeta(t, post.topic).label

        return (
          <LedgerRow
            key={post.slug}
            post={post}
            index={index}
            topicLabel={label}
            relevanceLabel={t('article.relevance')}
            newLabel={t('radar.newBadge')}
            sourcesLabel={t('radar.sourcesCount', { count: post.sources.length })}
            fallbackLabel={t('console.signalFallback')}
            compact={compact}
          />
        )
      })}
    </div>
  )
}