import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  postIndexSchema,
  postSchema,
  type Post,
  type PostSummary,
} from '@nexsift/schemas/post'

let client: S3Client | null = null

function getS3Client() {
  if (client) {
    return client
  }

  const endpoint = process.env.AWS_ENDPOINT_URL || undefined
  const region = process.env.AWS_REGION

  if (!region) {
    throw new Error('AWS_REGION is required')
  }

  client = new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
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

export async function deleteObject(key: string) {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  )
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=86400',
    }),
  )
}

export async function listObjects(prefix: string) {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )

    keys.push(
      ...(response.Contents ?? [])
        .map((item) => item.Key)
        .filter((key): key is string => Boolean(key)),
    )

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined
  } while (continuationToken)

  return keys
}

export async function listPostSlugs() {
  const keys = await listObjects('public/posts/')

  return keys
    .filter((key) => key.endsWith('.json'))
    .map((key) => key.slice('public/posts/'.length, -'.json'.length))
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
