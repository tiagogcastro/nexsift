import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { postIndexSchema, type PostSummary } from '@nexsift/schemas/post'
import { topicSchema } from '@nexsift/schemas/topic'

const region = process.env.AWS_REGION ?? 'us-east-1'
const bucket = process.env.CONTENT_BUCKET ?? 'nexsift-content-prod'
const outputFile = path.join(process.cwd(), 'packages/dev-publish/catalog.json')

const client = new S3Client({ region })

async function readJson(key: string): Promise<unknown> {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) throw new Error(`S3 object ${key} has no body`)
  return JSON.parse(await response.Body.transformToString()) as unknown
}

function toCatalogEntry(post: PostSummary) {
  return {
    slug: post.slug,
    title: post.title,
    topic: post.topic,
    relatedTopics: post.relatedTopics,
    signalType: post.signalType,
    signalDate: post.signalDate,
    publishedAt: post.publishedAt,
    relevanceScore: post.relevanceScore,
    confidenceScore: post.confidenceScore,
    sources: post.sources.map((source) => ({
      title: source.title,
      publisher: source.publisher,
      url: source.url,
    })),
  }
}

// The topic indexes carry the whole archive and the summary fields, so the
// catalog is built from seven objects instead of reading every stored post.
async function main() {
  const signals = []
  const seen = new Set<string>()

  for (const topic of topicSchema.options) {
    const index = postIndexSchema.parse(await readJson(`public/indexes/topics/${topic}.json`))
    const sorted = [...index].sort(
      (first, second) => Date.parse(second.publishedAt) - Date.parse(first.publishedAt),
    )
    for (const post of sorted) {
      if (seen.has(post.slug)) continue
      seen.add(post.slug)
      signals.push(toCatalogEntry(post))
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: bucket,
    count: signals.length,
    signals,
  }

  await writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`catalog written with ${signals.length} signals`)
}

main().catch((error) => {
  console.error('catalog_failed', error)
  process.exitCode = 1
})
