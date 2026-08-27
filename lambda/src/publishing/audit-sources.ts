import type { Post } from '@nexsift/schemas/post'
import { postSummarySchema } from '@nexsift/schemas/post'
import type { SourceStatus, VerifiedPostSource } from '@nexsift/schemas/source'
import { topicSchema } from '@nexsift/schemas/topic'
import {
  getPost,
  listPostSlugs,
  putIndex,
  putPost,
} from '../storage/s3'
import {
  applySourceReplacement,
  latestIndexKey,
  latestLimit,
  sortByPublishedAt,
} from './publish-post'
import type { SourceCheck } from './validate-source'
import {
  SourceRejectedError,
  validateSourceUrl,
} from './validate-source'
import type { RequestContext } from '../runtime/observability'

export interface SourceAuditEntry {
  slug: string
  url: string
  requestedUrl: string
  finalUrl: string
  httpStatus: number | null
  sourceStatus: SourceStatus
  checkedAt: string
  needsReplacement: boolean
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
  replacements: number
  replacementCandidates: number
  entries: SourceAuditEntry[]
}

type AuditCounts = Omit<SourceAuditResult, 'checkedAt' | 'entries'>

const archiveDiscoveryTimeoutMs = 10_000

// Periodic routine, separate from the editorial flow. Revalidates every
// source of every published signal and records the outcome on each stored
// post without changing editorial content. A broken source does not delete
// or rewrite a signal; it only flags the source for review. Indexes are
// derived once from the audited posts at the end, so every run also heals
// drift in latest.json and all topic indexes.
export async function auditAllSources(
  requestContext?: RequestContext,
): Promise<SourceAuditResult> {
  const slugs = await listPostSlugs()
  const posts = (await Promise.all(slugs.map((slug) => getPost(slug)))).filter(
    (post): post is Post => Boolean(post),
  )
  const checkedAt = new Date().toISOString()
  const counts: AuditCounts = {
    checked: 0,
    healthy: 0,
    redirected: 0,
    temporarily_unavailable: 0,
    broken: 0,
    replaced: 0,
    blocked: 0,
    replacements: 0,
    replacementCandidates: 0,
  }
  const entries: SourceAuditEntry[] = []
  const audited: Post[] = []

  for (const post of posts.sort((first, second) => sortByPublishedAt(first, second))) {
    const { post: updated, changed } = await auditPostSources(
      post,
      checkedAt,
      counts,
      entries,
      requestContext,
    )

    // lastCheckedAt moves on every check, so only status-level changes are
    // worth an S3 write; unchanged posts keep their previous timestamps.
    if (changed) {
      await putPost(updated)
    }

    audited.push(updated)
  }

  await rebuildIndexes(audited)

  return { checkedAt, ...counts, entries }
}

// Derives every index file from the full set of stored posts instead of
// merging per-post updates: one write per index regardless of post count,
// and stale entries disappear instead of accumulating.
async function rebuildIndexes(posts: Post[]) {
  const summaries = posts.map((post) => postSummarySchema.parse(post))

  await putIndex(
    latestIndexKey,
    [...summaries].sort(sortByPublishedAt).slice(0, latestLimit),
  )

  await Promise.all(
    topicSchema.options.map(async (topic) => {
      const topicPosts = summaries
        .filter((summary) => summary.topic === topic)
        .sort(sortByPublishedAt)

      await putIndex(`public/indexes/topics/${topic}.json`, topicPosts)
    }),
  )
}

async function auditPostSources(
  post: Post,
  checkedAt: string,
  counts: AuditCounts,
  entries: SourceAuditEntry[],
  requestContext?: RequestContext,
): Promise<{ post: Post; changed: boolean }> {
  const results = await Promise.allSettled(
    post.sources.map((source) => validateSourceUrl(source.url, { requestContext })),
  )

  const sources: VerifiedPostSource[] = []

  for (let index = 0; index < post.sources.length; index++) {
    const source = post.sources[index]

    if (!source) {
      continue
    }

    const result = results[index]

    if (result?.status === 'fulfilled') {
      const check = result.value
      const storedStatus = storeStatus(check, source)
      counts.checked += 1
      counts[storedStatus] += 1
      entries.push(makeEntry(post, source, check, storedStatus, false))

      sources.push({
        ...source,
        lastCheckedAt: check.checkedAt,
        lastSuccessfulAt: check.ok ? check.checkedAt : source.lastSuccessfulAt,
        finalUrl: check.finalUrl,
        sourceStatus: storedStatus,
        ...(isHttpStatus(check.status) ? { httpStatus: check.status } : {}),
      })
      continue
    }

    const reason = result?.reason
    const check = reason instanceof SourceRejectedError ? reason.check : null

    if (!check) {
      counts.checked += 1
      counts.temporarily_unavailable += 1
      entries.push({
        slug: post.slug,
        url: source.url,
        requestedUrl: source.url,
        finalUrl: source.url,
        httpStatus: null,
        sourceStatus: 'temporarily_unavailable',
        checkedAt,
        needsReplacement: false,
      })
      sources.push({
        ...source,
        lastCheckedAt: checkedAt,
        sourceStatus: 'temporarily_unavailable',
      })
      continue
    }

    const failedStatus = check.sourceStatus
    const needsReplacement =
      failedStatus === 'broken' || failedStatus === 'blocked'
    counts.checked += 1
    counts[failedStatus] += 1
    entries.push(makeEntry(post, source, check, failedStatus, needsReplacement))

    const recovered = await recoverBrokenSource(source, check, counts, requestContext)

    if (recovered) {
      sources.push(recovered)
      continue
    }

    sources.push({
      ...source,
      lastCheckedAt: check.checkedAt,
      finalUrl: check.finalUrl,
      sourceStatus: failedStatus,
      ...(isHttpStatus(check.status) ? { httpStatus: check.status } : {}),
    })
  }

  return {
    post: { ...post, sources },
    changed: sourcesChanged(post.sources, sources),
  }
}

// A write is only worth it when a source moved between states or its
// effective URL changed. Timestamp-only updates (lastCheckedAt) do not
// count, otherwise every audit run would rewrite every post.
function sourcesChanged(
  before: VerifiedPostSource[],
  after: VerifiedPostSource[],
): boolean {
  if (before.length !== after.length) {
    return true
  }

  return before.some((source, index) => {
    const next = after[index]

    if (!next) {
      return true
    }

    return (
      source.url !== next.url ||
      source.sourceStatus !== next.sourceStatus ||
      source.httpStatus !== next.httpStatus ||
      source.finalUrl !== next.finalUrl ||
      (source.replacements?.length ?? 0) !== (next.replacements?.length ?? 0)
    )
  })
}

function storeStatus(
  check: SourceCheck,
  source: VerifiedPostSource,
): SourceStatus {
  if (check.ok && (source.replacements?.length ?? 0) > 0) {
    return 'replaced'
  }

  return check.sourceStatus
}

function makeEntry(
  post: Post,
  source: VerifiedPostSource,
  check: SourceCheck,
  storedStatus: SourceStatus,
  needsReplacement: boolean,
): SourceAuditEntry {
  return {
    slug: post.slug,
    url: source.url,
    requestedUrl: check.requestedUrl,
    finalUrl: check.finalUrl,
    httpStatus: check.status,
    sourceStatus: storedStatus,
    checkedAt: check.checkedAt,
    needsReplacement,
  }
}

// Link rot recovery: a definitively dead page (404, 410, soft-404 or
// homepage redirect) is looked up in the Internet Archive CDX API. The
// snapshot URL comes from the archive index, never from guessing, and the
// snapshot is mechanically validated and title-checked before it replaces
// the original. Blocked pages (403) are not touched: the page likely exists
// for humans, so the limitation is recorded instead.
async function recoverBrokenSource(
  source: VerifiedPostSource,
  check: SourceCheck,
  counts: AuditCounts,
  requestContext?: RequestContext,
): Promise<VerifiedPostSource | null> {
  if (check.sourceStatus !== 'broken') {
    return null
  }

  const archived = await discoverArchivedCopy(source.url)

  if (!archived) {
    counts.replacementCandidates += 1
    return null
  }

  const snapshotCheck = await validateSourceUrl(archived, { requestContext })

  if (!snapshotCheck.ok || !titlesMatch(snapshotCheck.pageTitle, source.title)) {
    counts.replacementCandidates += 1
    return null
  }

  counts.replacements += 1
  counts.broken -= 1
  counts.replaced += 1

  return applySourceReplacement(
    source,
    archived,
    snapshotCheck,
    'recovered from Internet Archive',
  )
}

function isHttpStatus(status: number | null): status is number {
  return status !== null && status >= 100 && status <= 599
}

export async function discoverArchivedCopy(url: string): Promise<string | null> {
  const cdxUrl =
    `https://web.archive.org/cdx/search/cdx` +
    `?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode` +
    `&filter=statuscode:200&filter=mimetype:text/html` +
    `&collapse=digest&limit=1&from=1996`

  try {
    const response = await fetch(cdxUrl, {
      headers: {
        'user-agent': `NexSift-Source-Validator/1.0 (+${process.env.SITE_URL ?? 'https://nexsift.vercel.app'})`,
      },
      signal: AbortSignal.timeout(archiveDiscoveryTimeoutMs),
    })

    if (!response.ok) {
      return null
    }

    const rows = (await response.json()) as unknown

    if (
      !Array.isArray(rows) ||
      rows.length < 2 ||
      !Array.isArray(rows[1]) ||
      typeof rows[1][0] !== 'string' ||
      typeof rows[1][1] !== 'string'
    ) {
      return null
    }

    const timestamp = rows[1][0]
    const original = rows[1][1]

    return `https://web.archive.org/web/${timestamp}/${original}`
  } catch {
    return null
  }
}

// Sanity check before a snapshot replaces the original: the archived page
// title must share enough meaningful words with the recorded source title,
// otherwise the archive may hold a different page.
function titlesMatch(snapshotTitle: string | null, sourceTitle: string): boolean {
  if (!snapshotTitle) {
    return false
  }

  const sourceWords = significantWords(sourceTitle)
  const snapshotWords = new Set(significantWords(snapshotTitle))

  if (sourceWords.length === 0) {
    return false
  }

  const matched = sourceWords.filter((word) => snapshotWords.has(word)).length

  return matched / sourceWords.length >= 0.5
}

function significantWords(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
}
