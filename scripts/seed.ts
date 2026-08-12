import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  postSchema,
  postSummarySchema,
  type PostSummary,
  type Topic,
} from '@nexsift/contracts'

const endpoint = process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566'
const region = process.env.AWS_REGION ?? 'us-east-1'
const bucket = process.env.CONTENT_BUCKET ?? 'nexsift-content-local'
const dataDirectory = path.join(process.cwd(), 'scripts', 'data', 'posts')

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
})

async function main() {
  const files = (await readdir(dataDirectory)).filter((file) =>
    file.endsWith('.json'),
  )
  const posts = await Promise.all(
    files.map(async (file) => {
      const body = await readFile(path.join(dataDirectory, file), 'utf8')
      return postSchema.parse(JSON.parse(body))
    }),
  )

  for (const post of posts) {
    await putJson(`public/posts/${post.slug}.json`, post)
  }

  const summaries = posts
    .map((post) => postSummarySchema.parse(post))
    .sort(sortByPublishedAt)

  await putJson('public/indexes/latest.json', summaries)

  const topics = new Set<Topic>(posts.flatMap((post) => post.topics))
  for (const topic of topics) {
    await putJson(
      `public/indexes/topics/${topic}.json`,
      summaries.filter((post) => post.topics.includes(topic)),
    )
  }

  console.log(`seed_complete posts=${posts.length} bucket=${bucket}`)
}

async function putJson(key: string, value: unknown) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json; charset=utf-8',
    }),
  )
}

function sortByPublishedAt(first: PostSummary, second: PostSummary) {
  return (
    new Date(second.publishedAt).getTime() -
    new Date(first.publishedAt).getTime()
  )
}

main().catch((error) => {
  console.error('seed_failed', error)
  process.exitCode = 1
})
