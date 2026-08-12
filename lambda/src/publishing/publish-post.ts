import {
  postSummarySchema,
  type Post,
  type PostDraft,
  type PostSummary,
} from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { getIndex, getPost, putIndex, putPost } from '../storage/s3'
import { normalizePost } from './normalize-post'
import { createSlug } from './slug'

export const latestIndexKey = 'public/indexes/latest.json'
const latestLimit = 100

export async function publishPost(draft: PostDraft) {
  const normalizedSlug = createSlug(draft.slug ?? draft.title)
  const existing = await getPost(normalizedSlug)
  const post = normalizePost(draft, existing)

  await putPost(post)
  await updateLatestIndex(post)
  await synchronizeTopicIndexes(post, existing)

  return post
}

async function updateLatestIndex(post: Post) {
  const index = await getIndex(latestIndexKey)
  const nextIndex = upsertSummary(index, post)
    .sort(sortByPublishedAt)
    .slice(0, latestLimit)

  await putIndex(latestIndexKey, nextIndex)
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
