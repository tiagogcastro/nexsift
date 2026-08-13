import { readFile } from 'node:fs/promises'
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { postSchema, postSummarySchema, type Post } from '@nexsift/schemas/post'
import type { EditorialStatus } from '@nexsift/schemas/source'
import { validateSourceUrl } from '../src/publishing/validate-source'

// One-off migration for production posts published before the source
// verification gate existed. It adds the verification record fields to
// every source, revalidates each URL mechanically with the real validator,
// and rebuilds the index files so the frontend and listRecentPosts never
// see stale source data again.
//
// Rules:
// - verifiedAtPublication is derived from evidence, never invented: true
//   only when the recorded check happened at most 60s before the post was
//   stored (checked right before publishing or updating).
// - firstVerifiedAt keeps the earliest known mechanical check (the stored
//   lastCheckedAt), it is never fabricated.
// - editorialStatus and editoriallyVerifiedAt come from an explicit
//   editorial audit file (url -> {status, at}); nothing is derived from
//   HTTP status.
// - Dry run by default; pass --write to apply changes.
//
// Usage (from repo root):
//   AWS_PROFILE=nexsift CONTENT_BUCKET=nexsift-content-prod \
//     yarn tsx lambda/scripts/migrate-verification-fields.ts \
//       --editorial-file=/tmp/opencode/nexsift-audit/editorial-audit.json [--write]

interface EditorialRecord {
  editorialStatus: EditorialStatus
  editoriallyVerifiedAt: string
}

const bucket = process.env.CONTENT_BUCKET
const region = process.env.AWS_REGION ?? 'us-east-1'

function getClient() {
  return new S3Client({ region })
}

async function listPostKeys(client: S3Client) {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'public/posts/',
        ContinuationToken: continuationToken,
      }),
    )

    for (const item of response.Contents ?? []) {
      if (item.Key?.endsWith('.json')) {
        keys.push(item.Key)
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return keys
}

async function readJson(client: S3Client, key: string) {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )

  if (!response.Body) {
    throw new Error(`S3 object ${key} has no body`)
  }

  return JSON.parse(await response.Body.transformToString()) as unknown
}

async function writeJson(client: S3Client, key: string, value: unknown) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json; charset=utf-8',
      CacheControl: key.includes('/indexes/')
        ? 'public, max-age=60'
        : 'public, max-age=300',
    }),
  )
}

function verifiedAtPublicationRule(post: Post) {
  const reference = post.updatedAt ?? post.publishedAt
  const referenceMs = new Date(reference).getTime()

  return (lastCheckedAt: string | undefined) => {
    if (!lastCheckedAt) {
      return false
    }

    return (
      new Date(lastCheckedAt).getTime() <= referenceMs + 60_000 &&
      new Date(lastCheckedAt).getTime() >= referenceMs - 300_000
    )
  }
}

async function main() {
  if (!bucket) {
    throw new Error('CONTENT_BUCKET is required')
  }

  const editorialFileArg = process.argv.find((arg) => arg.startsWith('--editorial-file='))
  const editorialFilePath = editorialFileArg?.slice('--editorial-file='.length)
  const write = process.argv.includes('--write')

  if (!editorialFilePath) {
    throw new Error('--editorial-file=<path> is required')
  }

  const editorial = JSON.parse(
    await readFile(editorialFilePath, 'utf8'),
  ) as Record<string, EditorialRecord>

  const client = getClient()
  const keys = await listPostKeys(client)
  const posts: Post[] = []
  const changed = new Map<string, string[]>()

  for (const key of keys) {
    const post = postSchema.parse(await readJson(client, key))
    posts.push(post)
  }

  console.log(`posts=${posts.length} sources=${posts.flatMap((p) => p.sources).length}`)

  for (const post of posts) {
    const rule = verifiedAtPublicationRule(post)
    const reasons: string[] = []
    const sources = []

    for (const source of post.sources) {
      const record = editorial[source.url]

      if (!record) {
        throw new Error(`Missing editorial record for ${source.url} (${post.slug})`)
      }

      const check = await validateSourceUrl(source.url)
      const verifiedAtPublication = rule(source.lastCheckedAt)
      let firstVerifiedAt = source.firstVerifiedAt ?? source.lastCheckedAt

      if (!firstVerifiedAt && verifiedAtPublication) {
        firstVerifiedAt = post.updatedAt ?? post.publishedAt
      }

      if (!source.verifiedAtPublication && verifiedAtPublication) {
        reasons.push(`verifiedAtPublication`)
      }

      if (!source.editorialStatus || source.editorialStatus === 'unknown') {
        reasons.push(`editorialStatus=${record.editorialStatus}`)
      }

      if (source.sourceStatus !== check.sourceStatus || source.httpStatus !== check.status) {
        reasons.push(`sourceStatus=${source.sourceStatus}->${check.sourceStatus}`)
      }

      sources.push({
        ...source,
        ...(verifiedAtPublication ? { verifiedAtPublication } : {}),
        ...(firstVerifiedAt ? { firstVerifiedAt } : {}),
        editorialStatus: record.editorialStatus,
        editoriallyVerifiedAt: record.editoriallyVerifiedAt,
        lastCheckedAt: check.checkedAt,
        lastSuccessfulAt: check.ok ? check.checkedAt : source.lastSuccessfulAt,
        httpStatus: check.status ?? source.httpStatus,
        finalUrl: check.finalUrl,
        sourceStatus: check.sourceStatus,
      })
    }

    if (reasons.length > 0) {
      changed.set(post.slug, reasons)
    }

    posts.splice(posts.indexOf(post), 1, { ...post, sources })
  }

  console.log('== migration changes ==')
  for (const [slug, reasons] of changed) {
    console.log(`- ${slug}: ${reasons.join(', ')}`)
  }

  if (!write) {
    console.log('dry run; pass --write to apply')
    return
  }

  for (const post of posts) {
    await writeJson(client, `public/posts/${post.slug}.json`, post)
  }

  const latest = posts
    .map((post) => postSummarySchema.parse(post))
    .sort(compareByPublishedAt)

  await writeJson(client, 'public/indexes/latest.json', latest)

  const topics = new Set(posts.flatMap((post) => post.topics))

  for (const topic of topics) {
    const index = posts
      .filter((post) => post.topics.includes(topic))
      .map((post) => postSummarySchema.parse(post))
      .sort(compareByPublishedAt)

    await writeJson(client, `public/indexes/topics/${topic}.json`, index)
  }

  console.log('applied: posts and indexes written to S3')
}

function compareByPublishedAt(
  first: { publishedAt: string },
  second: { publishedAt: string },
) {
  return (
    new Date(second.publishedAt).getTime() -
    new Date(first.publishedAt).getTime()
  )
}

main().catch((error) => {
  console.error('migrate_failed', error)
  process.exitCode = 1
})
