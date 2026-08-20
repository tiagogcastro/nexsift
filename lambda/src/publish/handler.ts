import { randomUUID } from 'node:crypto'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import {
  postDraftSchema,
  postIdentitySchema,
  postListItemSchema,
} from '@nexsift/schemas/post'
import { signalTypeSchema } from '@nexsift/schemas/signal-type'
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
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
import { buildSignalSlug } from '../publishing/signal-slug'
import {
  approximateJsonSize,
  errorDetails,
  logError,
  logInfo,
  type RequestContext,
} from '../runtime/observability'

const defaultRecentLimit = 30
const maxRecentLimit = 100

type ListDetail = 'full' | 'compact'

interface ListQuery {
  since?: string | undefined
  topic?: string | undefined
  signalType?: string | undefined
  limit?: string | undefined
  detail?: string | undefined
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequestValidationError'
  }
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const requestContext = createRequestContext(event)
  const startedAt = Date.now()
  let operation = 'unknown'

  try {
    const token = process.env.PUBLISH_TOKEN
    const authorization = getHeaderValue(event.headers, 'authorization')

    if (!token || authorization !== `Bearer ${token}`) {
      return errorResponse(
        401,
        requestContext,
        operation,
        startedAt,
        'AUTH_ERROR',
        'Unauthorized',
      )
    }

    // Function URLs and HTTP API v2 events use requestContext.http.method;
    // REST-style events (MiniStack Invoke API) use httpMethod.
    const method =
      event.requestContext?.http?.method ??
      (event as { httpMethod?: string }).httpMethod ??
      'GET'

    const path =
      event.rawPath ??
      event.requestContext?.http?.path ??
      (event as { path?: string }).path ??
      '/'

    const slug = extractSlug(path)

    if (method === 'GET' && slug) {
      operation = 'getPost'
      const post = await getPost(slug)

      if (!post) {
        return errorResponse(
          404,
          requestContext,
          operation,
          startedAt,
          'NOT_FOUND',
          'Signal not found',
        )
      }

      logSuccess(requestContext, operation, startedAt, {
        slug,
        status: 200,
      })
      return response(200, post, requestContext)
    }

    if (method === 'DELETE' && slug) {
      operation = 'deletePost'
      const result = await deletePost(slug)
      logSuccess(requestContext, operation, startedAt, {
        slug,
        status: 200,
      })
      return response(200, { ok: true, ...result }, requestContext)
    }

    if (method === 'GET' && path === '/') {
      operation = 'listRecentPosts'
      const query = event.queryStringParameters ?? {}
      const posts = await listRecentPosts({
        since: query.since,
        topic: query.topic,
        signalType: query.signalType,
        limit: query.limit,
        detail: query.detail,
      })
      const body = { posts }

      logSuccess(requestContext, operation, startedAt, {
        status: 200,
        resultCount: posts.length,
        limit: parseLimit(query.limit),
        detail: parseDetail(query.detail),
        filters: {
          since: query.since,
          topic: query.topic,
          signalType: query.signalType,
        },
        responseSizeBytes: approximateJsonSize(body),
      })

      return response(200, body, requestContext)
    }

    if (method === 'POST' && path === '/validate-source') {
      operation = 'validateSource'
      const body = parseBody(event) as { url?: unknown }
      const url = body.url

      if (typeof url !== 'string' || url.length === 0) {
        throw new RequestValidationError('url is required')
      }

      try {
        const check = await validateSourceUrl(url, { requestContext })
        logSuccess(requestContext, operation, startedAt, {
          status: 200,
          upstreamStatus: check.status,
          sourceStatus: check.sourceStatus,
          attempt: check.attempts,
        })
        return response(200, check, requestContext)
      } catch (error) {
        if (error instanceof SourceRejectedError && error.check) {
          const statusCode = error.check.retryable ? 503 : 422
          const code = error.check.errorCode ?? 'SOURCE_REJECTED'
          return errorResponse(
            statusCode,
            requestContext,
            operation,
            startedAt,
            code,
            error.check.retryable ? 'Source temporarily unavailable' : 'Source rejected',
            {
              retryable: error.check.retryable,
              check: error.check,
            },
          )
        }

        throw error
      }
    }

    if (method === 'POST' && path === '/audit-sources') {
      operation = 'auditSources'
      const result = await auditAllSources(requestContext)
      logSuccess(requestContext, operation, startedAt, {
        status: 200,
        checked: result.checked,
        replacements: result.replacements,
      })
      return response(200, result, requestContext)
    }

    const replaceMatch = path.match(/^\/posts\/([^/]+)\/sources\/(\d+)\/replace$/)

    if (method === 'POST' && replaceMatch) {
      operation = 'replaceSource'
      const slug = decodeURIComponent(replaceMatch[1] ?? '')
      const index = Number.parseInt(replaceMatch[2] ?? '', 10)
      const body = parseBody(event) as { newUrl?: unknown; reason?: unknown }

      if (typeof body.newUrl !== 'string' || typeof body.reason !== 'string') {
        throw new RequestValidationError('newUrl and reason are required')
      }

      const post = await replacePostSource(
        slug,
        index,
        body.newUrl,
        body.reason,
        requestContext,
      )

      logSuccess(requestContext, operation, startedAt, {
        status: 200,
        slug,
        sourceCount: post.sources.length,
      })

      return response(200, post, requestContext)
    }

    if (method === 'POST' && path === '/posts/resolve') {
      operation = 'resolvePost'
      const body = parseBody(event)
      const identity = postIdentitySchema.parse(body)
      const slug = buildSignalSlug(
        identity.primaryTopic,
        identity.title,
        identity.signalDate,
      )
      const post = await getPost(slug)

      logSuccess(requestContext, operation, startedAt, {
        status: 200,
        slug,
        exists: Boolean(post),
      })

      return response(
        200,
        { exists: Boolean(post), slug, post: post ?? undefined },
        requestContext,
      )
    }

    if (method === 'POST' && path === '/') {
      operation = 'publishPost'
      const body = parseBody(event)
      const draft = postDraftSchema.parse(body.post)
      const gateIssues = validateEditorialGates(draft)

      if (gateIssues.length > 0) {
        return errorResponse(
          422,
          requestContext,
          operation,
          startedAt,
          'EDITORIAL_GATE_REJECTED',
          'Editorial gate not met',
          { issues: gateIssues },
        )
      }

      const result = await publishPost(draft, requestContext)
      const bodyResponse = {
        ok: true,
        slug: result.post.slug,
        operation: result.operation,
        publishedAt: result.post.publishedAt,
        updatedAt: result.post.updatedAt,
      }

      logSuccess(requestContext, operation, startedAt, {
        status: 201,
        slug: result.post.slug,
        result: result.operation,
        sourceCount: result.post.sources.length,
        imageCount: result.imageCount,
      })

      return response(201, bodyResponse, requestContext)
    }

    return errorResponse(
      404,
      requestContext,
      operation,
      startedAt,
      'NOT_FOUND',
      'Route not found',
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse(
        400,
        requestContext,
        operation,
        startedAt,
        'VALIDATION_ERROR',
        'Invalid JSON payload',
      )
    }

    if (error instanceof RequestValidationError) {
      return errorResponse(
        422,
        requestContext,
        operation,
        startedAt,
        'VALIDATION_ERROR',
        error.message,
      )
    }

    if (error instanceof NotFoundError) {
      return errorResponse(
        404,
        requestContext,
        operation,
        startedAt,
        'NOT_FOUND',
        'Signal not found',
      )
    }

    if (error instanceof SourceIndexError) {
      return errorResponse(
        422,
        requestContext,
        operation,
        startedAt,
        'VALIDATION_ERROR',
        error.message,
      )
    }

    if (error instanceof SourceRejectedError) {
      const failureMeta = summarizeSourceFailure(error)
      return errorResponse(
        failureMeta.statusCode,
        requestContext,
        operation,
        startedAt,
        failureMeta.code,
        failureMeta.message,
        { retryable: failureMeta.retryable, issues: error.failures },
      )
    }

    if (error instanceof ImageRejectedError) {
      return errorResponse(
        error.retryable ? 503 : 422,
        requestContext,
        operation,
        startedAt,
        error.code,
        error.retryable ? 'Image temporarily unavailable' : 'Cover image rejected',
        {
          retryable: error.retryable,
          reason: error.reason,
          attempt: error.attempts,
          upstreamStatus: error.status,
        },
      )
    }

    if (isValidationError(error)) {
      return errorResponse(
        422,
        requestContext,
        operation,
        startedAt,
        'VALIDATION_ERROR',
        'Invalid post payload',
        { issues: error.issues },
      )
    }

    return errorResponse(
      operation === 'listRecentPosts' ? 503 : 500,
      requestContext,
      operation,
      startedAt,
      operation === 'listRecentPosts' ? 'LIST_FAILED' : 'INTERNAL_ERROR',
      operation === 'listRecentPosts' ? 'Failed to list recent signals' : 'Publication failed',
      { retryable: operation === 'listRecentPosts' },
      error,
    )
  }
}

function extractSlug(path: string) {
  const match = path.match(/^\/posts\/([^/]+)$/)
  return match ? decodeURIComponent(match[1] ?? '') : null
}

async function listRecentPosts(query: ListQuery) {
  const index = await getIndex(latestIndexKey)
  const since = parseSince(query.since)
  const topic = parseTopic(query.topic)
  const signalType = parseSignalType(query.signalType)
  const limit = parseLimit(query.limit)
  const detail = parseDetail(query.detail)

  const filtered = index
    .filter((post) => {
      if (since !== null && new Date(post.publishedAt).getTime() < since) {
        return false
      }

      if (topic && !post.topics.includes(topic)) {
        return false
      }

      if (signalType && post.signalType !== signalType) {
        return false
      }

      return true
    })
    .slice(0, limit)

  if (detail === 'compact') {
    return filtered.map((post) => postListItemSchema.parse(post))
  }

  return filtered
}

function parseLimit(value?: string) {
  const parsed = Number.parseInt(value ?? '', 10)

  if (Number.isNaN(parsed)) {
    return defaultRecentLimit
  }

  return Math.min(Math.max(parsed, 1), maxRecentLimit)
}

function parseSince(value?: string) {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    throw new RequestValidationError('since must be a valid ISO 8601 date-time')
  }

  return timestamp
}

function parseTopic(value?: string): Topic | undefined {
  if (!value) {
    return undefined
  }

  const result = topicSchema.safeParse(value)

  if (!result.success) {
    throw new RequestValidationError('topic must be a valid NexSift topic')
  }

  return result.data
}

function parseSignalType(value?: string) {
  if (!value) {
    return undefined
  }

  const result = signalTypeSchema.safeParse(value)

  if (!result.success) {
    throw new RequestValidationError('signalType must be a valid NexSift signal type')
  }

  return result.data
}

function parseDetail(value?: string): ListDetail {
  if (!value || value === 'full') {
    return 'full'
  }

  if (value === 'compact') {
    return 'compact'
  }

  throw new RequestValidationError('detail must be full or compact')
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

function response(
  statusCode: number,
  body: unknown,
  requestContext: RequestContext,
) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestContext.requestId,
      'x-correlation-id': requestContext.correlationId,
    },
    body: JSON.stringify(body),
  }
}

function errorResponse(
  statusCode: number,
  requestContext: RequestContext,
  operation: string,
  startedAt: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
  error?: unknown,
) {
  logError('publish_api_error', {
    operation,
    requestId: requestContext.requestId,
    correlationId: requestContext.correlationId,
    status: statusCode,
    errorType: code,
    durationMs: Date.now() - startedAt,
    ...extra,
    ...(error ? { error: errorDetails(error) } : {}),
  })

  return response(
    statusCode,
    {
      error: message,
      code,
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      ...extra,
    },
    requestContext,
  )
}

function summarizeSourceFailure(error: SourceRejectedError) {
  const failures = error.failures

  if (failures.some((failure) => failure.errorCode === 'VALIDATION_ERROR')) {
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      retryable: false,
      message: 'Source editorial verification is missing',
    }
  }

  if (failures.length > 0 && failures.every((failure) => failure.retryable)) {
    const codes = new Set(failures.map((failure) => failure.errorCode))
    const code = codes.has('RATE_LIMITED')
      ? 'RATE_LIMITED'
      : codes.has('UPSTREAM_TIMEOUT')
        ? 'UPSTREAM_TIMEOUT'
        : 'SOURCE_UNAVAILABLE'

    return {
      statusCode: 503,
      code,
      retryable: true,
      message: 'Source temporarily unavailable',
    }
  }

  return {
    statusCode: 422,
    code: 'SOURCE_REJECTED',
    retryable: false,
    message: 'Source verification failed',
  }
}

function logSuccess(
  requestContext: RequestContext,
  operation: string,
  startedAt: number,
  details: Record<string, unknown>,
) {
  logInfo('publish_api_request', {
    operation,
    requestId: requestContext.requestId,
    correlationId: requestContext.correlationId,
    durationMs: Date.now() - startedAt,
    ...details,
  })
}

function createRequestContext(event: APIGatewayProxyEventV2): RequestContext {
  const requestId = event.requestContext?.requestId ?? randomUUID()
  const correlationId =
    getHeaderValue(event.headers, 'x-correlation-id') ?? requestId

  return { requestId, correlationId }
}

function getHeaderValue(
  headers: Record<string, string | undefined> | undefined,
  name: string,
) {
  if (!headers) {
    return undefined
  }

  const normalized = name.toLowerCase()

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalized) {
      return value
    }
  }

  return undefined
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
