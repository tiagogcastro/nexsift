import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { postDraftSchema } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { validateEditorialGates } from '../publishing/gates'
import {
  deletePost,
  latestIndexKey,
  NotFoundError,
  publishPost,
  replacePostSource,
  SourceIndexError,
} from '../publishing/publish-post'
import { getIndex, getPost } from '../storage/s3'
import {
  SourceRejectedError,
  validateSourceUrl,
} from '../publishing/validate-source'
import { auditAllSources } from '../publishing/audit-sources'
import { ImageRejectedError } from '../publishing/fetch-image'

const defaultRecentLimit = 30
const maxRecentLimit = 100

interface ListQuery {
  since?: string | undefined
  topic?: string | undefined
  signalType?: string | undefined
  limit?: string | undefined
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const token = process.env.PUBLISH_TOKEN
    const authorization = event.headers.authorization

    if (!token || authorization !== `Bearer ${token}`) {
      return response(401, { error: 'Unauthorized' })
    }

    // Function URLs and HTTP API v2 events use requestContext.http.method;
    // REST-style events (MiniStack Invoke API) use httpMethod.
    const method =
      event.requestContext?.http?.method ??
      (event as { httpMethod?: string }).httpMethod

    const path =
      event.rawPath ??
      event.requestContext?.http?.path ??
      (event as { path?: string }).path ??
      '/'

    const slug = extractSlug(path)

    if (method === 'GET' && slug) {
      const post = await getPost(slug)

      if (!post) {
        return response(404, { error: 'Signal not found' })
      }

      return response(200, post)
    }

    if (method === 'DELETE' && slug) {
      const result = await deletePost(slug)
      return response(200, { ok: true, ...result })
    }

    if (method === 'GET' && path === '/') {
      const query = event.queryStringParameters ?? {}
      const posts = await listRecentPosts({
        since: query.since,
        topic: query.topic,
        signalType: query.signalType,
        limit: query.limit,
      })
      return response(200, { posts })
    }

    if (method === 'POST' && path === '/validate-source') {
      const body = parseBody(event) as { url?: unknown }
      const url = body.url

      if (typeof url !== 'string' || url.length === 0) {
        return response(422, { error: 'url is required' })
      }

      try {
        const check = await validateSourceUrl(url)
        return response(200, check)
      } catch (error) {
        if (error instanceof SourceRejectedError && error.check) {
          return response(422, {
            error: 'Source rejected',
            check: error.check,
          })
        }

        throw error
      }
    }

    if (method === 'POST' && path === '/audit-sources') {
      const result = await auditAllSources()
      return response(200, result)
    }

    const replaceMatch = path.match(/^\/posts\/([^/]+)\/sources\/(\d+)\/replace$/)

    if (method === 'POST' && replaceMatch) {
      const slug = decodeURIComponent(replaceMatch[1] ?? '')
      const index = Number.parseInt(replaceMatch[2] ?? '', 10)
      const body = parseBody(event) as { newUrl?: unknown; reason?: unknown }

      if (typeof body.newUrl !== 'string' || typeof body.reason !== 'string') {
        return response(422, { error: 'newUrl and reason are required' })
      }

      const post = await replacePostSource(slug, index, body.newUrl, body.reason)

      return response(200, post)
    }

    if (method === 'POST' && path === '/') {
      const body = parseBody(event)
      const draft = postDraftSchema.parse(body.post)
      const gateIssues = validateEditorialGates(draft)

      if (gateIssues.length > 0) {
        return response(422, {
          error: 'Editorial gate not met',
          issues: gateIssues,
        })
      }

      const result = await publishPost(draft)

      return response(201, {
        ok: true,
        slug: result.post.slug,
        operation: result.operation,
        publishedAt: result.post.publishedAt,
        updatedAt: result.post.updatedAt,
      })
    }

    return response(404, { error: 'Route not found' })
  } catch (error) {
    console.error('publish_failed', error)

    if (error instanceof SyntaxError) {
      return response(400, { error: 'Invalid JSON payload' })
    }

    if (error instanceof NotFoundError) {
      return response(404, { error: 'Signal not found' })
    }

    if (error instanceof SourceIndexError) {
      return response(422, { error: error.message })
    }

    if (error instanceof SourceRejectedError) {
      return response(422, {
        error: 'Source verification failed',
        issues: error.failures,
      })
    }

    if (error instanceof ImageRejectedError) {
      return response(422, {
        error: 'Cover image rejected',
        reason: error.reason,
      })
    }

    if (isValidationError(error)) {
      return response(422, { error: 'Invalid post payload', issues: error.issues })
    }

    return response(500, { error: 'Publication failed' })
  }
}

function extractSlug(path: string) {
  const match = path.match(/^\/posts\/([^/]+)$/)
  return match ? decodeURIComponent(match[1] ?? '') : null
}

async function listRecentPosts(query: ListQuery) {
  const index = await getIndex(latestIndexKey)
  const since = query.since ? new Date(query.since).getTime() : null
  const limit = parseLimit(query.limit)

  return index
    .filter((post) => {
      if (since !== null && new Date(post.publishedAt).getTime() < since) {
        return false
      }

      if (query.topic && !post.topics.includes(query.topic as Topic)) {
        return false
      }

      if (query.signalType && post.signalType !== query.signalType) {
        return false
      }

      return true
    })
    .slice(0, limit)
}

function parseLimit(value?: string) {
  const parsed = Number.parseInt(value ?? '', 10)

  if (Number.isNaN(parsed)) {
    return defaultRecentLimit
  }

  return Math.min(Math.max(parsed, 1), maxRecentLimit)
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
