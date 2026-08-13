import {
  postSummarySchema,
  type Post,
  type PostDraft,
  type PostSummary,
} from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import {
  deleteObject,
  getIndex,
  getPost,
  putIndex,
  putPost,
} from '../storage/s3'
import { normalizePost } from './normalize-post'
import { buildSignalSlug } from './signal-slug'

export const latestIndexKey = 'public/indexes/latest.json'
const latestLimit = 100

export type PublishResult = {
  post: Post
  operation: 'created' | 'updated'
}

export class NotFoundError extends Error {
  constructor(slug: string) {
    super(`Signal not found: ${slug}`)
    this.name = 'NotFoundError'
  }
}

export async function publishPost(draft: PostDraft): Promise<PublishResult> {
  const primaryTopic = draft.topics[0]

  if (!primaryTopic) {
    throw new Error('A post needs at least one topic')
  }

  const slug = buildSignalSlug(primaryTopic, draft.title, draft.signalDate)
  const existing = await getPost(slug)
  const post = normalizePost(draft, existing)

  await putPost(post)
  await updateLatestIndex(post)
  await synchronizeTopicIndexes(post, existing)

  return { post, operation: existing ? 'updated' : 'created' }
}

export async function deletePost(slug: string) {
  const existing = await getPost(slug)

  if (!existing) {
    throw new NotFoundError(slug)
  }

  await deleteObject(`public/posts/${slug}.json`)
  await removeFromLatestIndex(slug)
  await removeFromTopicIndexes(existing)

  return { slug, deletedAt: new Date().toISOString() }
}

async function updateLatestIndex(post: Post) {
  const index = await getIndex(latestIndexKey)
  const nextIndex = upsertSummary(index, post)
    .sort(sortByPublishedAt)
    .slice(0, latestLimit)

  await putIndex(latestIndexKey, nextIndex)
}

async function removeFromLatestIndex(slug: string) {
  const index = await getIndex(latestIndexKey)
  await putIndex(
    latestIndexKey,
    index.filter((item) => item.slug !== slug),
  )
}

async function synchronizeTopicIndexes(post: Post, existing: Post | null) {
  const affectedTopics = new Set<Topic>([
    ...post.topics,
    ...(existing?.topics ?? []),
  ])

  await Promise.all(
    [...affectedTopics].map(async (topic) => {
      const key = `public/indexes/topics/${topic}.json`
      const index = await getIndex(key)
      const nextIndex = post.topics.includes(topic)
        ? upsertSummary(index, post).sort(sortByPublishedAt)
        : index.filter((item) => item.slug !== post.slug)

      await putIndex(key, nextIndex)
    }),
  )
}

async function removeFromTopicIndexes(post: Post) {
  await Promise.all(
    post.topics.map(async (topic) => {
      const key = `public/indexes/topics/${topic}.json`
      const index = await getIndex(key)
      await putIndex(
        key,
        index.filter((item) => item.slug !== post.slug),
      )
    }),
  )
}

function upsertSummary(index: PostSummary[], post: Post) {
  const summary = postSummarySchema.parse(post)
  return [summary, ...index.filter((item) => item.slug !== post.slug)]
}

function sortByPublishedAt(first: PostSummary, second: PostSummary) {
  return (
    new Date(second.publishedAt).getTime() -
    new Date(first.publishedAt).getTime()
  )
}
