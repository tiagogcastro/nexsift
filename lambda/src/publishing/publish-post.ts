import {
  postSchema,
  postSummarySchema,
  type CoverImage,
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
  listObjects,
  putIndex,
  putObject,
  putPost,
} from '../storage/s3'
import { downloadImage } from './fetch-image'
import { resolveInlineImages } from './inline-images'
import { normalizePost } from './normalize-post'
import { buildSignalSlug } from './signal-slug'
import {
  SourceRejectedError,
  type SourceCheck,
  type SourceFailure,
  validateSourceUrl,
} from './validate-source'
import type { RequestContext } from '../runtime/observability'

export const latestIndexKey = 'public/indexes/latest.json'
export const latestLimit = 100

export type PublishResult = {
  post: Post
  operation: 'created' | 'updated'
  imageCount: number
}

export class NotFoundError extends Error {
  constructor(slug: string) {
    super(`Signal not found: ${slug}`)
    this.name = 'NotFoundError'
  }
}

export class SourceIndexError extends Error {
  constructor(index: number) {
    super(`Source index out of range: ${index}`)
    this.name = 'SourceIndexError'
  }
}

export function applySourceReplacement(
  current: VerifiedPostSource,
  newUrl: string,
  check: SourceCheck,
  reason: string,
): VerifiedPostSource {
  return {
    ...current,
    url: check.finalUrl,
    finalUrl: check.finalUrl,
    httpStatus: check.status ?? 0,
    sourceStatus: 'replaced',
    lastCheckedAt: check.checkedAt,
    lastSuccessfulAt: check.checkedAt,
    replacements: [
      ...(current.replacements ?? []),
      {
        oldUrl: current.url,
        newUrl: check.finalUrl,
        replacedAt: check.checkedAt,
        reason,
      },
    ],
  }
}

// Replaces one source of a published signal after mechanically validating
// the new URL. The original URL is preserved in the replacement history so
// a later review can distinguish link rot from a source that never existed.
export async function replacePostSource(
  slug: string,
  sourceIndex: number,
  newUrl: string,
  reason: string,
  requestContext?: RequestContext,
): Promise<Post> {
  const post = await getPost(slug)

  if (!post) {
    throw new NotFoundError(slug)
  }

  if (sourceIndex < 0 || sourceIndex >= post.sources.length) {
    throw new SourceIndexError(sourceIndex)
  }

  const check = await validateSourceUrl(newUrl, { requestContext })
  const current = post.sources[sourceIndex]

  const sources = post.sources.map((source, index) => {
    if (index !== sourceIndex || !current) {
      return source
    }

    return applySourceReplacement(current, newUrl, check, reason)
  })

  const updated = postSchema.parse({ ...post, sources, updatedAt: new Date().toISOString() })
  await putPost(updated)
  await updateLatestIndex(updated)
  await synchronizeTopicIndexes(updated, post)

  return updated
}

export async function publishPost(
  draft: PostDraft,
  requestContext?: RequestContext,
): Promise<PublishResult> {
  const primaryTopic = draft.topics[0]

  if (!primaryTopic) {
    throw new Error('A post needs at least one topic')
  }

  const slug = buildSignalSlug(primaryTopic, draft.title, draft.signalDate)
  const verifiedSources = await verifyPostSources(draft.sources, requestContext)
  const existing = await getPost(slug)
  const coverImage = await resolveCoverImage(draft, slug, existing, requestContext)
  const inline = await resolveInlineImages(draft.content, slug, requestContext)
  const post = normalizePost(
    {
      ...draft,
      sources: verifiedSources,
      content: inline.content,
      coverImage,
    },
    existing,
  )

  await putPost(post)
  await removeOrphanImages(slug, [
    ...inline.objectKeys,
    ...(coverImage ? [coverImage.objectKey] : []),
  ])
  await updateLatestIndex(post)
  await synchronizeTopicIndexes(post, existing)

  return {
    post,
    operation: existing ? 'updated' : 'created',
    imageCount: inline.objectKeys.length + (coverImage ? 1 : 0),
  }
}

// Deletes stored images of a slug that the published post no longer
// references. The prefix split on '-' and '.' avoids matching a different
// signal whose slug starts with this one.
async function removeOrphanImages(slug: string, usedKeys: string[]) {
  const used = new Set(usedKeys)
  const keys = [
    ...(await listObjects(`public/images/${slug}-`)),
    ...(await listObjects(`public/images/${slug}.`)),
  ]

  for (const key of keys) {
    if (!used.has(key)) {
      await deleteObject(key)
    }
  }
}

// Downloads the draft cover image into the content bucket as a snapshot, so
// the site never hotlinks the source host. A draft without a cover image
// removes the stored copy of a previous publish; a changed image deletes the
// stale object after the new one is written.
async function resolveCoverImage(
  draft: PostDraft,
  slug: string,
  existing: Post | null,
  requestContext?: RequestContext,
): Promise<CoverImage | undefined> {
  const previous = existing?.coverImage

  if (!draft.coverImage) {
    if (previous) {
      await deleteObject(previous.objectKey)
    }

    return undefined
  }

  const downloaded = await downloadImage(draft.coverImage.url, { requestContext })
  const objectKey = `public/images/${slug}${downloaded.extension}`

  if (previous && previous.objectKey !== objectKey) {
    await deleteObject(previous.objectKey)
  }

  await putObject(objectKey, downloaded.buffer, downloaded.contentType)

  return {
    objectKey,
    sourceUrl: downloaded.finalUrl,
    contentType: downloaded.contentType,
    alt: draft.coverImage.alt,
    caption: draft.coverImage.caption,
    checkedAt: new Date().toISOString(),
  }
}

// Every source URL must be fetched and inspected at publication time. The
// editor's claim that a source was checked is never trusted on its own: the
// backend reopens the exact URL and records the result on the stored source.
export async function verifyPostSources(
  sources: PostDraft['sources'],
  requestContext?: RequestContext,
): Promise<VerifiedPostSource[]> {
  const checkedAt = new Date().toISOString()
  const editorialFailures = collectEditorialFailures(sources)

  if (editorialFailures.length > 0) {
    throw new SourceRejectedError(
      `Editorial verification missing for ${editorialFailures.length} source(s)`,
      null,
      editorialFailures,
    )
  }

  const results = await Promise.allSettled(
    sources.map((source) => validateSourceUrl(source.url, { requestContext })),
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
          retryable: reason.check.retryable,
          errorCode: reason.check.errorCode,
          attempts: reason.check.attempts,
        })
      } else {
        failures.push({
          url: source.url,
          status: null,
          sourceStatus: 'temporarily_unavailable',
          retryable: true,
          errorCode: 'SOURCE_UNAVAILABLE',
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
      editorialStatus: source.editorialStatus,
      editoriallyVerifiedAt: source.editoriallyVerifiedAt,
      firstVerifiedAt: checkedAt,
      verifiedAtPublication: true,
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

// The backend never derives editorial validity from HTTP status. The
// editorial flow must assert, per source, that the page was read and that
// its content sustains the signal (acontecimento, data, versões, números).
// Without that assertion the publish gate stays closed.
function collectEditorialFailures(
  sources: PostDraft['sources'],
): SourceFailure[] {
  const failures: SourceFailure[] = []

  for (const source of sources) {
    if (source.editorialStatus !== 'verified' || !source.editoriallyVerifiedAt) {
      failures.push({
        url: source.url,
        status: null,
        sourceStatus: 'temporarily_unavailable',
        retryable: false,
        errorCode: 'VALIDATION_ERROR',
        reason: 'editorial assertion missing',
      })
    }
  }

  return failures
}

export async function deletePost(slug: string) {
  const existing = await getPost(slug)

  if (!existing) {
    throw new NotFoundError(slug)
  }

  await deleteObject(`public/posts/${slug}.json`)
  await removeOrphanImages(slug, [])
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

export function upsertSummary(index: PostSummary[], post: Post) {
  const summary = postSummarySchema.parse(post)
  return [summary, ...index.filter((item) => item.slug !== post.slug)]
}

export function sortByPublishedAt(first: PostSummary, second: PostSummary) {
  return (
    new Date(second.publishedAt).getTime() -
    new Date(first.publishedAt).getTime()
  )
}
