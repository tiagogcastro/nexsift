import { randomUUID } from 'node:crypto'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { postDraftSchema, postIdentitySchema } from '@nexsift/schemas/post'
import { topicSchema } from '@nexsift/schemas/topic'
import { signalTypeSchema } from '@nexsift/schemas/signal-type'
import { fetchWithRetry, UpstreamRequestError } from '../http/fetch-with-retry'
import { errorDetails, logError, logInfo } from '../runtime/observability'
import editorialInstructions from '../../../docs/gpt-editor-instructions.md'
import editorialReference from '../../../docs/gpt-editor-reference.md'
import payloadReference from '../../../docs/gpt-editor-payload-reference.md'

const editorialBundleVersion = '2026-08-20'

async function callApi(
  operation: string,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; text: string }> {
  const apiUrl = process.env.PUBLISH_API_URL ?? ''
  const token = process.env.PUBLISH_TOKEN ?? ''
  const correlationId = randomUUID()
  const startedAt = Date.now()

  try {
    const { response, attempt } = await fetchWithRetry(
      `${apiUrl}${path}`,
      {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'x-correlation-id': correlationId,
          ...init?.headers,
        },
      },
      { timeoutMs: 10_000 },
    )

    const text = await response.text()

    logInfo('mcp_proxy_call', {
      operation,
      correlationId,
      status: response.status,
      attempt,
      durationMs: Date.now() - startedAt,
    })

    return { status: response.status, text }
  } catch (error) {
    const status =
      error instanceof UpstreamRequestError && error.code === 'UPSTREAM_TIMEOUT'
        ? 504
        : 503
    const code =
      error instanceof UpstreamRequestError ? error.code : 'SOURCE_UNAVAILABLE'

    logError('mcp_proxy_call_failed', {
      operation,
      correlationId,
      status,
      durationMs: Date.now() - startedAt,
      errorType: code,
      error: errorDetails(error),
    })

    return {
      status,
      text: JSON.stringify({
        error: 'Publish API unavailable',
        code,
        retryable: true,
        correlationId,
      }),
    }
  }
}

function toolResult(status: number, text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    isError: status >= 400,
  }
}

const server = new McpServer(
  { name: 'nexsift-editor', version: '2.0.0' },
  { capabilities: { tools: {} } },
)

server.registerTool(
  'listRecentPosts',
  {
    title: 'List recent signals',
    description:
      'Lists recent NexSift signals, optionally filtered by `since`, `topic`, `signalType` and `limit` (max 100). Use `detail: "compact"` for coverage, discovery and degraded mode because it avoids returning full sources.',
    inputSchema: {
      since: z
        .string()
        .describe('Only signals published at or after this ISO 8601 date/time.')
        .optional(),
      topic: topicSchema.optional(),
      signalType: signalTypeSchema.optional(),
      limit: z.number().int().min(1).max(100).optional(),
      detail: z.enum(['full', 'compact']).optional(),
    },
  },
  async ({ since, topic, signalType, limit, detail }) => {
    const params = new URLSearchParams()
    const requestedDetail = detail ?? 'compact'

    if (since) params.set('since', since)
    if (topic) params.set('topic', topic)
    if (signalType) params.set('signalType', signalType)
    if (limit) params.set('limit', String(limit))
    params.set('detail', requestedDetail)

    const query = params.toString()
    let result = await callApi('listRecentPosts', `/?${query}`)

    if (result.status >= 500 && (limit ?? 0) > 60) {
      params.set('limit', '60')
      params.set('detail', 'compact')
      result = await callApi('listRecentPosts', `/?${params.toString()}`)
    }

    return toolResult(result.status, result.text)
  },
)

server.registerTool(
  'resolvePost',
  {
    title: 'Resolve a signal identity',
    description:
      'Uses the exact backend slug function to resolve `{ title, primaryTopic, signalDate }` into a slug and tells whether the signal already exists.',
    inputSchema: postIdentitySchema,
  },
  async (identity) => {
    const { status, text } = await callApi('resolvePost', '/posts/resolve', {
      method: 'POST',
      body: JSON.stringify(identity),
    })
    return toolResult(status, text)
  },
)

server.registerTool(
  'publishPost',
  {
    title: 'Publish a signal',
    description:
      'Upserts a signal via the publication API. The backend derives the slug, resolves duplicates, runs source verification and applies the editorial gates; 422 responses carry fixable reasons and 503 responses indicate retryable upstream failures.',
    inputSchema: { post: postDraftSchema },
  },
  async ({ post }) => {
    const { status, text } = await callApi('publishPost', '/', {
      method: 'POST',
      body: JSON.stringify({ post }),
    })
    return toolResult(status, text)
  },
)

server.registerTool(
  'validateSource',
  {
    title: 'Validate a source URL',
    description:
      'Mechanically verifies a single source URL. Returns the source check when successful, 422 for rejected sources and 503/504 for retryable upstream failures.',
    inputSchema: { url: z.string().url() },
  },
  async ({ url }) => {
    const { status, text } = await callApi('validateSource', '/validate-source', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
    return toolResult(status, text)
  },
)

server.registerTool(
  'auditSources',
  {
    title: 'Audit all published sources',
    description:
      'Re-verifies the sources of every published signal and reports broken or failed ones. Use to detect signals whose sources have died.',
  },
  async () => {
    const { status, text } = await callApi('auditSources', '/audit-sources', {
      method: 'POST',
      body: '{}',
    })
    return toolResult(status, text)
  },
)

server.registerTool(
  'getPost',
  {
    title: 'Get a signal by slug',
    description:
      'Fetches a single published signal by its slug, including sources, scores and editorial verification fields. Returns 404 when the slug does not exist.',
    inputSchema: { slug: z.string().min(1) },
  },
  async ({ slug }) => {
    const { status, text } = await callApi(
      'getPost',
      `/posts/${encodeURIComponent(slug)}`,
    )
    return toolResult(status, text)
  },
)

server.registerTool(
  'deletePost',
  {
    title: 'Delete a signal',
    description:
      'Deletes a published signal by slug. Use only for accidental publication, wrong slug, duplication, invalid source or a material factual error; republish the corrected signal afterwards.',
    inputSchema: { slug: z.string().min(1) },
  },
  async ({ slug }) => {
    const { status, text } = await callApi(
      'deletePost',
      `/posts/${encodeURIComponent(slug)}`,
      {
        method: 'DELETE',
      },
    )
    return toolResult(status, text)
  },
)

server.registerTool(
  'replaceSource',
  {
    title: 'Replace a signal source',
    description:
      'Replaces the source at `index` of a published signal with a new URL. The new source is mechanically verified before the replacement is stored.',
    inputSchema: {
      slug: z.string().min(1),
      index: z.number().int().min(0),
      newUrl: z.string().url(),
      reason: z.string().min(1),
    },
  },
  async ({ slug, index, newUrl, reason }) => {
    const { status, text } = await callApi(
      'replaceSource',
      `/posts/${encodeURIComponent(slug)}/sources/${index}/replace`,
      {
        method: 'POST',
        body: JSON.stringify({ newUrl, reason }),
      },
    )
    return toolResult(status, text)
  },
)

server.registerTool(
  'editorialInstructions',
  {
    title: 'Load editorial instructions',
    description:
      'Returns the full NexSift editorial instructions, reference and payload contract. Call this once at the start of the editorial routine, before listing, researching or publishing anything.',
  },
  async () => ({
    content: [
      {
        type: 'text' as const,
        text: [
          '### editorial-bundle',
          `version: ${editorialBundleVersion}`,
          '### gpt-editor-instructions.md',
          editorialInstructions,
          '---',
          '### gpt-editor-reference.md',
          editorialReference,
          '---',
          '### gpt-editor-payload-reference.md',
          payloadReference,
        ].join('\n\n'),
      },
    ],
  }),
)

function toWebRequest(event: APIGatewayProxyEventV2): Request {
  const headers = new Headers()
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined) headers.set(key, value)
  }

  const query = event.rawQueryString ? `?${event.rawQueryString}` : ''
  const url = `https://${event.requestContext?.domainName ?? 'mcp.local'}${event.rawPath ?? '/'}${query}`

  const init: RequestInit = {
    method: event.requestContext?.http?.method ?? 'POST',
    headers,
  }

  if (event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body
  }

  return new Request(url, init)
}

async function toLambdaResult(
  response: Response,
): Promise<APIGatewayProxyStructuredResultV2> {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
  }
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const startedAt = Date.now()
  const method =
    event.requestContext?.http?.method ??
    (event as { httpMethod?: string }).httpMethod
  const requestId = event.requestContext?.requestId ?? randomUUID()

  // The client probes GET for an SSE stream first and treats 405 as
  // "server does not offer SSE", falling back to POST-only JSON requests.
  if (method === 'GET') {
    return { statusCode: 405, headers: { allow: 'POST' }, body: '' }
  }

  // Stateless mode (no sessionIdGenerator): a fresh transport per request,
  // with JSON responses so the Function URL can run in BUFFERED mode.
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    const response = await transport.handleRequest(toWebRequest(event))

    logInfo('mcp_request', {
      requestId,
      method,
      path: event.rawPath ?? '/',
      status: response.status,
      durationMs: Date.now() - startedAt,
    })

    return await toLambdaResult(response)
  } catch (error) {
    logError('mcp_request_failed', {
      requestId,
      method,
      path: event.rawPath ?? '/',
      durationMs: Date.now() - startedAt,
      error: errorDetails(error),
    })
    throw error
  } finally {
    await transport.close()
  }
}
