import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { postDraftSchema } from '@nexsift/schemas/post'
import { topicSchema } from '@nexsift/schemas/topic'
import { signalTypeSchema } from '@nexsift/schemas/signal-type'
import editorialInstructions from '../../../docs/gpt-editor-instructions.md'
import editorialReference from '../../../docs/gpt-editor-reference.md'
import payloadReference from '../../../docs/gpt-editor-payload-reference.md'

async function callApi(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; text: string }> {
  const apiUrl = process.env.PUBLISH_API_URL ?? ''
  const token = process.env.PUBLISH_TOKEN ?? ''

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init?.headers,
    },
  })

  return { status: response.status, text: await response.text() }
}

function toolResult(status: number, text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    isError: status >= 400,
  }
}

const server = new McpServer(
  { name: 'nexsift-editor', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.registerTool(
  'listRecentPosts',
  {
    title: 'List recent signals',
    description:
      'Lists the most recently published NexSift signals, optionally filtered by `since` (ISO 8601 date), `topic`, `signalType` and `limit` (max 100).',
    inputSchema: {
      since: z
        .string()
        .describe('Only signals published at or after this ISO 8601 date/time.')
        .optional(),
      topic: topicSchema.optional(),
      signalType: signalTypeSchema.optional(),
      limit: z.number().int().min(1).max(100).optional(),
    },
  },
  async ({ since, topic, signalType, limit }) => {
    const params = new URLSearchParams()
    if (since) params.set('since', since)
    if (topic) params.set('topic', topic)
    if (signalType) params.set('signalType', signalType)
    if (limit) params.set('limit', String(limit))

    const query = params.toString()
    const { status, text } = await callApi(`/?${query}`)
    return toolResult(status, text)
  },
)

server.registerTool(
  'publishPost',
  {
    title: 'Publish a signal',
    description:
      'Upserts a signal (post) via the publication API. The backend derives the slug, runs source verification and applies the editorial gates; 422 responses carry the reason to fix. Republishing the same slug updates the signal.',
    inputSchema: { post: postDraftSchema },
  },
  async ({ post }) => {
    const { status, text } = await callApi('/', {
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
      'Mechanically verifies a single source URL (openability, editorial claim, date, version, numbers). Returns the verification check with `editorialStatus` and `editoriallyVerifiedAt`.',
    inputSchema: { url: z.string().url() },
  },
  async ({ url }) => {
    const { status, text } = await callApi('/validate-source', {
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
    const { status, text } = await callApi('/audit-sources', {
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
    const { status, text } = await callApi(`/posts/${encodeURIComponent(slug)}`)
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
    const { status, text } = await callApi(`/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    })
    return toolResult(status, text)
  },
)

server.registerTool(
  'replaceSource',
  {
    title: 'Replace a signal source',
    description:
      'Replaces the source at `index` of a published signal with a new URL. The new source is mechanically verified before the replacement is stored; the post is updated with the new `editorialStatus`.',
    inputSchema: {
      slug: z.string().min(1),
      index: z.number().int().min(0),
      newUrl: z.string().url(),
      reason: z.string().min(1),
    },
  },
  async ({ slug, index, newUrl, reason }) => {
    const { status, text } = await callApi(
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
  const method =
    event.requestContext?.http?.method ??
    (event as { httpMethod?: string }).httpMethod

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
    return await toLambdaResult(response)
  } finally {
    await transport.close()
  }
}
