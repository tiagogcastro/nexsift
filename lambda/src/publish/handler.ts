import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { postDraftSchema } from '@nexsift/contracts'
import { getPublishToken } from '../auth/publish-token'
import { publishPost } from '../publishing/publish-post'

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const token = await getPublishToken()
    const authorization = event.headers.authorization

    if (authorization !== `Bearer ${token}`) {
      return response(401, { error: 'Unauthorized' })
    }

    const body = parseBody(event)
    const draft = postDraftSchema.parse(body.post)
    const post = await publishPost(draft)

    return response(201, {
      ok: true,
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })
  } catch (error) {
    console.error('publish_failed', error)

    if (error instanceof SyntaxError) {
      return response(400, { error: 'Invalid JSON payload' })
    }

    if (isValidationError(error)) {
      return response(422, { error: 'Invalid post payload', issues: error.issues })
    }

    return response(500, { error: 'Publication failed' })
  }
}

function parseBody(event: APIGatewayProxyEventV2) {
  if (!event.body) {
    return {}
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body

  return JSON.parse(body) as { post?: unknown }
}

function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  }
}

function isValidationError(
  error: unknown,
): error is { issues: Array<Record<string, unknown>> } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'issues' in error &&
      Array.isArray((error as { issues?: unknown }).issues),
  )
}
