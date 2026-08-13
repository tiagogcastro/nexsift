import {
  postSummarySchema,
  type Post,
  type PostDraft,
  type PostSummary,
} from '@nexsift/schemas/post'
import type { VerifiedPostSource } from '@nexsift/schemas/source'
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
import {
  SourceRejectedError,
  type SourceFailure,
  validateSourceUrl,
} from './validate-source'

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

  const verifiedSources = await verifyPostSources(draft.sources)
  const slug = buildSignalSlug(primaryTopic, draft.title, draft.signalDate)
  const existing = await getPost(slug)
  const post = normalizePost({ ...draft, sources: verifiedSources }, existing)

  await putPost(post)
  await updateLatestIndex(post)
  await synchronizeTopicIndexes(post, existing)

  return { post, operation: existing ? 'updated' : 'created' }
}

// Every source URL must be fetched and inspected at publication time. The
// editor's claim that a source was checked is never trusted on its own: the
// backend reopens the exact URL and records the result on the stored source.
export async function verifyPostSources(
  sources: PostDraft['sources'],
): Promise<VerifiedPostSource[]> {
  const checkedAt = new Date().toISOString()

  const results = await Promise.allSettled(
    sources.map((source) => validateSourceUrl(source.url)),
  )

  const verified: VerifiedPostSource[] = []
  const failures: SourceFailure[] = []

  results.forEach((result, index) => {
    const source = sources[index]

    if (!source) {
      return
    }

    if (result.status === 'rejected') {
      const reason = result.reason

      if (reason instanceof SourceRejectedError && reason.check) {
        failures.push({
          url: source.url,
          status: reason.check.status,
          sourceStatus: reason.check.sourceStatus,
        })
      } else {
        failures.push({
          url: source.url,
          status: null,
          sourceStatus: 'temporarily_unavailable',
        })
      }

      return
    }

    const check = result.value

    verified.push({
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      publishedAt: source.publishedAt,
      lastCheckedAt: checkedAt,
      lastSuccessfulAt: check.ok ? check.checkedAt : undefined,
      httpStatus: check.status ?? 0,
      finalUrl: check.finalUrl,
      sourceStatus: check.sourceStatus,
    })
  })

  if (failures.length > 0) {
    throw new SourceRejectedError(
      `Source verification failed for ${failures.length} source(s)`,
      null,
      failures,
    )
  }

  return verified
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
