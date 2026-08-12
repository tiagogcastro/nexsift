import { unstable_cache } from 'next/cache'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  postIndexSchema,
  postSchema,
} from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'

function createS3Client() {
  const endpoint = process.env.AWS_ENDPOINT_URL || undefined
  const region = process.env.AWS_REGION

  if (!region) {
    throw new Error('AWS_REGION is required')
  }

  return new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: Boolean(endpoint),
  })
}

function getBucket() {
  const bucket = process.env.CONTENT_BUCKET

  if (!bucket) {
    throw new Error('CONTENT_BUCKET is required')
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

function cachedReadJsonObject(key: string) {
  return unstable_cache(() => readJsonObject(key), [key], {
    revalidate: 600,
  })
}

export async function listPosts() {
  try {
    const value = await cachedReadJsonObject('public/indexes/latest.json')()
    return postIndexSchema.parse(value)
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return []
    }

    throw error
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const value = await cachedReadJsonObject(`public/posts/${slug}.json`)()
    return postSchema.parse(value)
  } catch {
    return null
  }
}

export async function listPostsByTopic(topic: Topic) {
  try {
    const value = await cachedReadJsonObject(`public/indexes/topics/${topic}.json`)()
    return postIndexSchema.parse(value)
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return []
    }

    throw error
  }
}
