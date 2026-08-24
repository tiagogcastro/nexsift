// Rebuilds every topic index from the stored posts (the source of truth).
// A signal is listed only under its primary topic ({topics[0]}), so posts
// whose primary does not match an index key are purged from it. Run with the
// target environment's AWS credentials:
//
//   AWS_REGION=us-east-1 CONTENT_BUCKET=<bucket> yarn tsx packages/dev-publish/rebuild-topic-indexes.ts
//
// Safe to re-run: indexes are derived, never merged, so the result is
// deterministic.
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import {
  getPost,
  listPostSlugs,
  putIndex,
} from '../../lambda/src/storage/s3'
import {
  sortByPublishedAt,
  upsertSummary,
} from '../../lambda/src/publishing/publish-post'

const region = process.env.AWS_REGION
const bucket = process.env.CONTENT_BUCKET

if (!region || !bucket) {
  throw new Error('AWS_REGION and CONTENT_BUCKET are required')
}

async function main() {
  const slugs = await listPostSlugs()
  const indexes = new Map<Topic, Awaited<ReturnType<typeof upsertSummary>>>()

  for (const topic of topicSchema.options) {
    indexes.set(topic, [])
  }

  for (const slug of slugs) {
    const post = await getPost(slug)

    if (!post) {
      console.log(`missing ${slug}`)
      continue
    }

    const primaryTopic = post.topics[0]

    if (!primaryTopic) {
      console.log(`no_primary_topic ${slug}`)
      continue
    }

    const index = indexes.get(primaryTopic)

    if (!index) {
      console.log(`unknown_primary_topic ${slug} topic=${primaryTopic}`)
      continue
    }

    indexes.set(primaryTopic, upsertSummary(index, post))
  }

  for (const [topic, index] of indexes) {
    const nextIndex = [...index].sort(sortByPublishedAt)
    await putIndex(`public/indexes/topics/${topic}.json`, nextIndex)
    console.log(`topic=${topic} entries=${nextIndex.length}`)
  }

  console.log(`rebuild_topic_indexes done slugs=${slugs.length}`)
}

main().catch((error) => {
  console.error('rebuild_failed', error)
  process.exitCode = 1
})
