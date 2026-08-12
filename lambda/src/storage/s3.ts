import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  postIndexSchema,
  postSchema,
  type Post,
  type PostSummary,
} from '@nexsift/contracts'

let client: S3Client | null = null

function getS3Client() {
  if (client) {
    return client
  }

  const endpoint = process.env.AWS_ENDPOINT_URL || undefined
  client = new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint,
    forcePathStyle: Boolean(endpoint),
  })
  return client
}

function getBucket() {
  const bucket = process.env.CONTENT_BUCKET

  if (!bucket) {
    throw new Error('CONTENT_BUCKET is required')
  }

  return bucket
}

export async function getPost(slug: string) {
  try {
    const value = await readJson(`public/posts/${slug}.json`)
    return postSchema.parse(value)
  } catch (error) {
    if (isMissingObject(error)) {
      return null
    }
    throw error
  }
}

export async function putPost(post: Post) {
  await writeJson(`public/posts/${post.slug}.json`, post)
}

export async function getIndex(key: string): Promise<PostSummary[]> {
  try {
    const value = await readJson(key)
    return postIndexSchema.parse(value)
  } catch (error) {
    if (isMissingObject(error)) {
      return []
    }
    throw error
  }
}

export async function putIndex(key: string, posts: PostSummary[]) {
  await writeJson(key, posts)
}

async function readJson(key: string) {
  const response = await getS3Client().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  )

  if (!response.Body) {
    throw new Error(`S3 object ${key} has no body`)
  }

  return JSON.parse(await response.Body.transformToString()) as unknown
}

async function writeJson(key: string, value: unknown) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json; charset=utf-8',
      CacheControl: key.includes('/indexes/')
        ? 'public, max-age=60'
        : 'public, max-age=300',
    }),
  )
}

function isMissingObject(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const candidate = error as Error & { name?: string; $metadata?: { httpStatusCode?: number } }
  return (
    candidate.name === 'NoSuchKey' ||
    candidate.name === 'NotFound' ||
    candidate.$metadata?.httpStatusCode === 404
  )
}
