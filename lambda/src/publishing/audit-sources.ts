import type { Post } from '@nexsift/schemas/post'
import type { SourceStatus, VerifiedPostSource } from '@nexsift/schemas/source'
import { getIndex, getPost, putPost } from '../storage/s3'
import {
  SourceRejectedError,
  validateSourceUrl,
} from './validate-source'
import { latestIndexKey } from './publish-post'

export interface SourceAuditEntry {
  slug: string
  url: string
  requestedUrl: string
  finalUrl: string
  httpStatus: number | null
  sourceStatus: SourceStatus
  checkedAt: string
}

export interface SourceAuditResult {
  checkedAt: string
  checked: number
  healthy: number
  redirected: number
  temporarily_unavailable: number
  broken: number
  replaced: number
  blocked: number
  entries: SourceAuditEntry[]
}

// Periodic routine, separate from the editorial flow. Revalidates every
// source of every published signal and records the outcome on each stored
// post without changing editorial content. A broken source does not delete
// or rewrite a signal; it only flags the source for review.
export async function auditAllSources(): Promise<SourceAuditResult> {
  const index = await getIndex(latestIndexKey)
  const checkedAt = new Date().toISOString()
  const counts = {
    checked: 0,
    healthy: 0,
    redirected: 0,
    temporarily_unavailable: 0,
    broken: 0,
    replaced: 0,
    blocked: 0,
  }
  const entries: SourceAuditEntry[] = []

  for (const summary of index) {
    const post = await getPost(summary.slug)

    if (!post) {
      continue
    }

    const updated = await auditPostSources(post, checkedAt, counts, entries)
    await putPost(updated)
  }

  return { checkedAt, ...counts, entries }
}

async function auditPostSources(
  post: Post,
  checkedAt: string,
  counts: Omit<SourceAuditResult, 'checkedAt' | 'entries'>,
  entries: SourceAuditEntry[],
): Promise<Post> {
  const results = await Promise.allSettled(
    post.sources.map((source) => validateSourceUrl(source.url)),
  )

  const sources: VerifiedPostSource[] = post.sources.map((source, index) => {
    const result = results[index]

    if (result?.status === 'fulfilled') {
      const check = result.value
      counts.checked += 1
      counts[check.sourceStatus] += 1
      entries.push({
        slug: post.slug,
        url: source.url,
        requestedUrl: check.requestedUrl,
        finalUrl: check.finalUrl,
        httpStatus: check.status,
        sourceStatus: check.sourceStatus,
        checkedAt: check.checkedAt,
      })

      return {
        ...source,
        lastCheckedAt: check.checkedAt,
        lastSuccessfulAt: check.ok ? check.checkedAt : source.lastSuccessfulAt,
        httpStatus: check.status ?? source.httpStatus,
        finalUrl: check.finalUrl,
        sourceStatus: check.sourceStatus,
      }
    }

    const reason = result?.reason

    if (reason instanceof SourceRejectedError && reason.check) {
      const check = reason.check
      counts.checked += 1
      counts[check.sourceStatus] += 1
      entries.push({
        slug: post.slug,
        url: source.url,
        requestedUrl: check.requestedUrl,
        finalUrl: check.finalUrl,
        httpStatus: check.status,
        sourceStatus: check.sourceStatus,
        checkedAt: check.checkedAt,
      })

      return {
        ...source,
        lastCheckedAt: check.checkedAt,
        httpStatus: check.status ?? source.httpStatus,
        finalUrl: check.finalUrl,
        sourceStatus: check.sourceStatus,
      }
    }

    counts.temporarily_unavailable += 1
    entries.push({
      slug: post.slug,
      url: source.url,
      requestedUrl: source.url,
      finalUrl: source.url,
      httpStatus: null,
      sourceStatus: 'temporarily_unavailable',
      checkedAt,
    })

    return {
      ...source,
      lastCheckedAt: checkedAt,
      sourceStatus: 'temporarily_unavailable',
    }
  })

  return { ...post, sources }
}
