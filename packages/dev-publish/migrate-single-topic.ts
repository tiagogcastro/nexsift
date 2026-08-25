// One-time migration: converts stored posts from the legacy `topics` array
// to the single-topic contract (`topic` + `relatedTopics`) and derives every
// index file from the migrated posts. Delete this script after it has run
// against every environment (MiniStack and production).
//
//   AWS_REGION=us-east-1 CONTENT_BUCKET=<bucket> yarn tsx packages/dev-publish/migrate-single-topic.ts
//   AWS_REGION=us-east-1 AWS_ENDPOINT_URL=http://localhost:4566 CONTENT_BUCKET=<local-bucket> yarn tsx packages/dev-publish/migrate-single-topic.ts
//
// Safe to re-run: posts already carrying `topic` are only revalidated, and
// indexes are always fully derived from the stored posts.
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { postSchema, postSummarySchema } from '@nexsift/schemas/post'
import type { Post } from '@nexsift/schemas/post'
import { topicSchema } from '@nexsift/schemas/topic'
import {
  putPost,
  listPostSlugs,
  putIndex,
} from '../../lambda/src/storage/s3'
import {
  latestIndexKey,
  latestLimit,
  sortByPublishedAt,
} from '../../lambda/src/publishing/publish-post'

const region = process.env.AWS_REGION
const bucket = process.env.CONTENT_BUCKET

if (!region || !bucket) {
  throw new Error('AWS_REGION and CONTENT_BUCKET are required')
}

function createS3Client() {
  const endpoint = process.env.AWS_ENDPOINT_URL || undefined

  return new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: Boolean(endpoint),
  })
}

async function readRawJson(key: string): Promise<Record<string, unknown>> {
  const response = await createS3Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )

  if (!response.Body) {
    throw new Error(`S3 object ${key} has no body`)
  }

  return JSON.parse(await response.Body.transformToString()) as Record<
    string,
    unknown
  >
}

// Legacy records carry a `topics` array whose first element becomes the
// primary topic and whose remainder becomes contextual relatedTopics.
function toSingleTopic(raw: Record<string, unknown>) {
  if (typeof raw.topic === 'string') {
    return { post: raw, migrated: false }
  }

  const topics = Array.isArray(raw.topics) ? raw.topics : []
  const { topics: _legacy, ...rest } = raw

  return {
    post: {
      ...rest,
      topic: topics[0],
      relatedTopics: topics.slice(1),
    },
    migrated: true,
  }
}

async function main() {
  const slugs = await listPostSlugs()
  const posts: Post[] = []
  let migratedCount = 0

  for (const slug of slugs) {
    const { post: candidate, migrated } = toSingleTopic(
      await readRawJson(`public/posts/${slug}.json`),
    )
    const parsed = postSchema.parse(candidate)

    if (migrated) {
      await putPost(parsed)
      migratedCount += 1
    }

    posts.push(parsed)
  }

  const summaries = posts.map((post) => postSummarySchema.parse(post))

  await putIndex(
    latestIndexKey,
    [...summaries].sort(sortByPublishedAt).slice(0, latestLimit),
  )

  for (const topic of topicSchema.options) {
    const topicPosts = summaries
      .filter((summary) => summary.topic === topic)
      .sort(sortByPublishedAt)

    await putIndex(`public/indexes/topics/${topic}.json`, topicPosts)
    console.log(`topic=${topic} entries=${topicPosts.length}`)
  }

  console.log(`migrate_single_topic done slugs=${slugs.length} migrated=${migratedCount}`)
}

main().catch((error) => {
  console.error('migration_failed', error)
  process.exitCode = 1
})
