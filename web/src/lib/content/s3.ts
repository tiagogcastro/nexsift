import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  postIndexSchema,
  postSchema,
  type Topic,
} from '@nexsift/contracts'

function createS3Client() {
  const endpoint = process.env.AWS_ENDPOINT_URL || undefined

  return new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint,
    forcePathStyle: Boolean(endpoint),
  })
}

function getBucket() {
  const bucket = process.env.CONTENT_BUCKET

  if (!bucket) {
    throw new Error('CONTENT_BUCKET is required when CONTENT_SOURCE=s3')
  }

  return bucket
}

async function readJsonObject(key: string) {
  const response = await createS3Client().send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  )

  if (!response.Body) {
    throw new Error(`S3 object ${key} has no body`)
  }

  return JSON.parse(await response.Body.transformToString()) as unknown
}

export async function listS3Posts() {
  const value = await readJsonObject('public/indexes/latest.json')
  return postIndexSchema.parse(value)
}

export async function getS3Post(slug: string) {
  try {
    const value = await readJsonObject(`public/posts/${slug}.json`)
    return postSchema.parse(value)
  } catch {
    return null
  }
}

export async function listS3PostsByTopic(topic: Topic) {
  const value = await readJsonObject(`public/indexes/topics/${topic}.json`)
  return postIndexSchema.parse(value)
}
