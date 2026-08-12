import { getTranslations } from 'next-intl/server'
import type { PostSummary } from '@nexsift/schemas/post'
import { getTopicMeta } from '@/lib/topics'
import { LedgerRow } from './ledger-row'

export async function SignalLedger({
  posts,
  limit,
}: {
  posts: PostSummary[]
  limit?: number
}) {
  const t = await getTranslations()
  const visiblePosts = typeof limit === 'number' ? posts.slice(0, limit) : posts

  return (
    <div>
      {visiblePosts.map((post, index) => {
        const topic = post.topics[0]
        const shortLabel = topic ? getTopicMeta(t, topic).shortLabel : undefined

        return (
          <LedgerRow
            key={post.slug}
            post={post}
            index={index}
            shortLabel={shortLabel}
            fallbackLabel={t('console.signalFallback')}
          />
        )
      })}
    </div>
  )
}
