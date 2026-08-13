import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { postSummarySchema } from '@nexsift/schemas/post'
import { handler } from '../src/publish/handler'
import { NotFoundError } from '../src/publishing/publish-post'
import { SourceRejectedError } from '../src/publishing/validate-source'
import { getIndex, getPost } from '../src/storage/s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/publishing/publish-post', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/publishing/publish-post')>()
  return {
    ...actual,
    latestIndexKey: 'public/indexes/latest.json',
    NotFoundError: class NotFoundError extends Error {},
    publishPost: vi.fn(),
    deletePost: vi.fn(),
    replacePostSource: vi.fn(),
  }
})

vi.mock('../src/storage/s3', () => ({
  getIndex: vi.fn(),
  getPost: vi.fn(),
  putPost: vi.fn(),
  putIndex: vi.fn(),
}))

const { mockedValidate } = vi.hoisted(() => ({
  mockedValidate: vi.fn(),
}))

vi.mock('../src/publishing/validate-source', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/publishing/validate-source')>()
  return {
    ...actual,
    validateSourceUrl: mockedValidate,
  }
})

import {
  deletePost,
  publishPost,
} from '../src/publishing/publish-post'

const mockedPublishPost = vi.mocked(publishPost)
const mockedDeletePost = vi.mocked(deletePost)
const mockedGetIndex = vi.mocked(getIndex)
const mockedGetPost = vi.mocked(getPost)

function http(method: string, path: string) {
  return {
    accountId: 'anonymous',
    apiId: 'test',
    domainName: 'test.execute-api.local',
    domainPrefix: 'test',
    requestId: 'test-request',
    routeKey: '$default',
    stage: '$default',
    time: '2026-08-13T00:00:00Z',
    timeEpoch: 0,
    http: {
      method,
      path,
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'vitest',
    },
  }
}

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}) {
  return {
    version: '2.0',
    requestContext: http('GET', '/'),
    headers: { authorization: 'Bearer secret' },
    ...overrides,
  } as APIGatewayProxyEventV2
}

function makeSummary(slug: string, topics: string[], publishedAt: string) {
  return postSummarySchema.parse({
    id: `post_${slug}`,
    slug,
    title: `Sinal ${slug}`,
    description: 'Descrição de teste com mais de trinta caracteres.',
    topics,
    tags: [],
    signalDate: slug.slice(-10),
    publishedAt,
    readingTime: 2,
    relevanceScore: 8,
    confidenceScore: 8,
    signalType: 'release',
    depth: 'practical',
    featured: false,
    locale: 'pt-BR',
    sources: [
      { title: 'Source', publisher: 'Publisher', url: 'https://example.com' },
    ],
  })
}

function makeDraftPayload() {
  return {
    post: {
      title: 'Título longo o suficiente para o handler',
      description: 'Descrição com mais de trinta caracteres para o teste.',
      content:
        '## O sinal\n\nConteúdo com mais de cem caracteres para o schema.\n\n## O que mudou\n\nMudança concreta e verificável nas fontes.',
      whyItMatters: 'Por que isso importa para quem opera tecnologia.',
      topics: ['security'],
      signalDate: '2026-08-11',
      signalType: 'risk',
      depth: 'practical',
      sources: [
        { title: 'Source', publisher: 'Publisher', url: 'https://example.com' },
      ],
      relevanceScore: 8,
      confidenceScore: 9,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('PUBLISH_TOKEN', 'secret')
  mockedValidate.mockReset()
  mockedValidate.mockResolvedValue({
    ok: true,
    requestedUrl: 'https://example.com',
    finalUrl: 'https://example.com',
    status: 200,
    checkedAt: '2026-08-13T09:00:00.000Z',
    pageTitle: 'Example',
    contentType: 'text/html',
    sourceStatus: 'healthy',
  })
})

describe('handler auth', () => {
  it('returns 401 without a valid bearer token', async () => {
    const result = await handler(
      makeEvent({ headers: { authorization: 'Bearer wrong' } }),
    )

    expect(result.statusCode).toBe(401)
  })
})

describe('GET /', () => {
  it('returns the recent index with filters applied', async () => {
    mockedGetIndex.mockResolvedValue([
      makeSummary('devops-nova-release-2026-08-12', ['devops'], '2026-08-12T10:00:00.000Z'),
      makeSummary('ai-agentes-2026-08-11', ['ai'], '2026-08-11T10:00:00.000Z'),
      makeSummary('cloud-custos-2026-08-10', ['cloud'], '2026-08-10T10:00:00.000Z'),
    ])

    const result = await handler(
      makeEvent({
        requestContext: http('GET', '/'),
        queryStringParameters: { topic: 'ai', limit: '10' },
      }),
    )

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body ?? '{}') as { posts: unknown[] }
    expect(body.posts).toHaveLength(1)
    expect((body.posts[0] as { slug: string }).slug).toBe('ai-agentes-2026-08-11')
  })

  it('filters by since and signalType', async () => {
    mockedGetIndex.mockResolvedValue([
      makeSummary('ai-agentes-2026-08-12', ['ai'], '2026-08-12T10:00:00.000Z'),
      makeSummary('ai-agentes-2026-08-09', ['ai'], '2026-08-09T10:00:00.000Z'),
    ])

    const result = await handler(
      makeEvent({
        requestContext: http('GET', '/'),
        queryStringParameters: {
          since: '2026-08-10T00:00:00.000Z',
          signalType: 'release',
        },
      }),
    )

    const body = JSON.parse(result.body ?? '{}') as { posts: { slug: string }[] }
    expect(body.posts).toHaveLength(1)
    expect(body.posts[0]?.slug).toBe('ai-agentes-2026-08-12')
  })
})

describe('GET /posts/{slug}', () => {
  it('returns the full post', async () => {
    const summary = makeSummary('ai-agentes-2026-08-12', ['ai'], '2026-08-12T10:00:00.000Z')
    mockedGetPost.mockResolvedValue({
      ...summary,
      content: '## Conteúdo\n\nMais de cem caracteres para o schema de post.',
      whyItMatters: 'Importa para quem constrói tecnologia.',
    })

    const result = await handler(
      makeEvent({
        requestContext: http('GET', '/posts/ai-agentes-2026-08-12'),
      }),
    )

    expect(result.statusCode).toBe(200)
  })

  it('returns 404 for unknown slugs', async () => {
    mockedGetPost.mockResolvedValue(null)

    const result = await handler(
      makeEvent({
        requestContext: http('GET', '/posts/ai-agentes-2026-01-01'),
      }),
    )

    expect(result.statusCode).toBe(404)
  })
})

describe('POST /', () => {
  it('publishes and reports the operation', async () => {
    mockedPublishPost.mockResolvedValue({
      operation: 'created',
      post: {
        ...makeSummary('security-cve-2026-08-11', ['security'], '2026-08-11T12:00:00.000Z'),
        content: '## Conteúdo\n\nMais de cem caracteres para o schema de post.',
        whyItMatters: 'Importa para quem opera tecnologia.',
      },
    })

    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/'),
        body: JSON.stringify(makeDraftPayload()),
      }),
    )

    expect(result.statusCode).toBe(201)
    const body = JSON.parse(result.body ?? '{}') as { operation: string; slug: string }
    expect(body.operation).toBe('created')
    expect(body.slug).toBe('security-cve-2026-08-11')
  })

  it('returns 422 when the editorial gate fails', async () => {
    const payload = makeDraftPayload()
    payload.post.relevanceScore = 6
    payload.post.confidenceScore = 9

    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/'),
        body: JSON.stringify(payload),
      }),
    )

    expect(result.statusCode).toBe(422)
    expect(mockedPublishPost).not.toHaveBeenCalled()
  })
})

describe('DELETE /posts/{slug}', () => {
  it('deletes and reports the timestamp', async () => {
    mockedDeletePost.mockResolvedValue({
      slug: 'ai-agentes-2026-08-12',
      deletedAt: '2026-08-13T09:00:00.000Z',
    })

    const result = await handler(
      makeEvent({
        requestContext: http('DELETE', '/posts/ai-agentes-2026-08-12'),
      }),
    )

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body ?? '{}') as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 404 when the signal does not exist', async () => {
    mockedDeletePost.mockRejectedValue(new NotFoundError('ai-agentes-2026-01-01'))

    const result = await handler(
      makeEvent({
        requestContext: http('DELETE', '/posts/ai-agentes-2026-01-01'),
      }),
    )

    expect(result.statusCode).toBe(404)
  })
})

describe('POST /validate-source', () => {
  it('returns the check result for a valid source', async () => {
    mockedValidate.mockResolvedValue({
      ok: true,
      requestedUrl: 'https://example.com/article',
      finalUrl: 'https://example.com/article',
      status: 200,
      checkedAt: '2026-08-13T09:00:00.000Z',
      pageTitle: 'Article',
      contentType: 'text/html',
      sourceStatus: 'healthy',
    })

    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/validate-source'),
        body: JSON.stringify({ url: 'https://example.com/article' }),
      }),
    )

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body ?? '{}') as { ok: boolean }
    expect(body.ok).toBe(true)
    expect(mockedValidate).toHaveBeenCalledWith('https://example.com/article')
  })

  it('returns 422 when the source is rejected', async () => {
    mockedValidate.mockRejectedValue(
      new SourceRejectedError('Source rejected: http 404', {
        ok: false,
        requestedUrl: 'https://example.com/missing',
        finalUrl: 'https://example.com/missing',
        status: 404,
        checkedAt: '2026-08-13T09:00:00.000Z',
        pageTitle: null,
        contentType: null,
        sourceStatus: 'broken',
      }),
    )

    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/validate-source'),
        body: JSON.stringify({ url: 'https://example.com/missing' }),
      }),
    )

    expect(result.statusCode).toBe(422)
    const body = JSON.parse(result.body ?? '{}') as { error: string; check: { status: number } }
    expect(body.error).toBe('Source rejected')
    expect(body.check.status).toBe(404)
  })

  it('returns 422 when url is missing', async () => {
    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/validate-source'),
        body: JSON.stringify({}),
      }),
    )

    expect(result.statusCode).toBe(422)
    expect(mockedValidate).not.toHaveBeenCalled()
  })
})

describe('POST /audit-sources', () => {
  it('reports the source audit result', async () => {
    mockedGetIndex.mockResolvedValue([
      makeSummary('ai-agentes-2026-08-12', ['ai'], '2026-08-12T10:00:00.000Z'),
    ])
    mockedGetPost.mockResolvedValue({
      ...makeSummary('ai-agentes-2026-08-12', ['ai'], '2026-08-12T10:00:00.000Z'),
      content: '## Conteúdo\n\nMais de cem caracteres para o schema de post.',
      whyItMatters: 'Importa para quem constrói tecnologia.',
    })

    const result = await handler(
      makeEvent({
        requestContext: http('POST', '/audit-sources'),
      }),
    )

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body ?? '{}') as { checked: number }
    expect(body.checked).toBe(1)
  })
})

describe('unknown routes', () => {
  it('returns 404', async () => {
    const result = await handler(
      makeEvent({
        requestContext: http('GET', '/nope'),
      }),
    )

    expect(result.statusCode).toBe(404)
  })
})
