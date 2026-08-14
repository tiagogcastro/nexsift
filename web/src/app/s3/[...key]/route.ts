import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

// Streams content-bucket objects that live under public/images/, so stored
// cover images are served from the site origin instead of a public bucket.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params
  const objectKey = key.join('/')

  if (
    key.length === 0 ||
    key.some((segment) => segment === '..' || segment === '') ||
    !objectKey.startsWith('public/images/')
  ) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const response = await createS3Client().send(
      new GetObjectCommand({
        Bucket: getBucket(),
        Key: objectKey,
      }),
    )

    if (!response.Body) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(response.Body.transformToWebStream(), {
      headers: {
        'content-type': response.ContentType ?? 'application/octet-stream',
        'cache-control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    if (isMissingObject(error)) {
      return new Response('Not found', { status: 404 })
    }

    return new Response('Server error', { status: 500 })
  }
}

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

function isMissingObject(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const candidate = error as Error & {
    name?: string
    $metadata?: { httpStatusCode?: number }
  }

  return (
    candidate.name === 'NoSuchKey' ||
    candidate.name === 'NotFound' ||
    candidate.$metadata?.httpStatusCode === 404
  )
}