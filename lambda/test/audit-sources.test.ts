import { postDraftSchema } from '@nexsift/schemas/post'
import { auditAllSources } from '../src/publishing/audit-sources'
import { latestIndexKey, publishPost } from '../src/publishing/publish-post'
import { SourceRejectedError } from '../src/publishing/validate-source'
import { getIndex, getPost } from '../src/storage/s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { store } = vi.hoisted(() => ({ store: new Map<string, unknown>() }))

vi.mock('@aws-sdk/client-s3', () => {
  class FakeClient {
    async send(command: { constructor: { name: string }; input: { Key: string; Body?: unknown } }) {
      const name = command.constructor.name
      const key = command.input.Key

      if (name === 'GetObjectCommand') {
        if (!store.has(key)) {
          const error = new Error('missing') as Error & { name: string }
          error.name = 'NoSuchKey'
          throw error
        }

        return {
          Body: { transformToString: async () => JSON.stringify(store.get(key)) },
        }
      }

      if (name === 'PutObjectCommand') {
        store.set(key, JSON.parse(String(command.input.Body)))
        return {}
      }

      if (name === 'DeleteObjectCommand') {
        store.delete(key)
        return {}
      }

      throw new Error(`Unexpected command ${name}`)
    }
  }

  return {
    S3Client: FakeClient,
    GetObjectCommand: class { constructor(public input: unknown) {} },
    PutObjectCommand: class { constructor(public input: unknown) {} },
    DeleteObjectCommand: class { constructor(public input: unknown) {} },
  }
})

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

function validCheck(url: string) {
  return {
    ok: true,
    requestedUrl: url,
    finalUrl: url,
    status: 200,
    checkedAt: '2026-08-20T12:00:00.000Z',
    pageTitle: 'Terraform changelog',
    contentType: 'text/html',
    sourceStatus: 'healthy' as const,
  }
}

function brokenCheck(url: string, status = 404) {
  return {
    ok: false,
    requestedUrl: url,
    finalUrl: url,
    status,
    checkedAt: '2026-08-20T12:00:00.000Z',
    pageTitle: null,
    contentType: 'text/html',
    sourceStatus: 'broken' as const,
  }
}

function makeDraft() {
  return postDraftSchema.parse({
    title: 'Terraform corrige regressão de plan',
    description: 'Atualização importante para quem usa módulos compartilhados.',
    content:
      '## O sinal\n\nO Terraform publicou uma nova release.\n\n## O que mudou\n\nCorrige uma regressão na fase de plan.',
    whyItMatters: 'Atualize antes de aplicar mudanças em produção.',
    topics: ['devops'],
    signalDate: '2026-08-12',
    signalType: 'release',
    depth: 'practical',
    sources: [
      {
        title: 'Terraform changelog',
        publisher: 'HashiCorp',
        url: 'https://example.com/terraform',
        editorialStatus: 'verified' as const,
        editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      },
    ],
    relevanceScore: 7.5,
    confidenceScore: 8,
  })
}

beforeEach(() => {
  store.clear()
  vi.stubEnv('CONTENT_BUCKET', 'test-bucket')
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.unstubAllGlobals()
  mockedValidate.mockReset()
  mockedValidate.mockImplementation((url: string) =>
    Promise.resolve(validCheck(url)),
  )
})

describe('auditAllSources', () => {
  it('refreshes the latest index after revalidating sources', async () => {
    const created = await publishPost(makeDraft())

    mockedValidate.mockImplementation((url: string) =>
      Promise.resolve({ ...validCheck(url), checkedAt: '2026-08-20T12:00:00.000Z' }),
    )
    await auditAllSources()

    const latest = await getIndex(latestIndexKey)
    expect(latest[0]?.sources[0]).toMatchObject({
      sourceStatus: 'healthy',
      lastCheckedAt: '2026-08-20T12:00:00.000Z',
    })

    const post = await getPost(created.post.slug)
    expect(post?.sources[0]?.lastCheckedAt).toBe('2026-08-20T12:00:00.000Z')
  })

  it('reports blocked counts for 403 responses', async () => {
    await publishPost(makeDraft())
    mockedValidate.mockRejectedValue(
      new SourceRejectedError('Source rejected: http 403', {
        ...validCheck('https://example.com/terraform'),
        ok: false,
        status: 403,
        sourceStatus: 'blocked',
      }),
    )

    const result = await auditAllSources()
    expect(result.blocked).toBe(1)
    expect(result.broken).toBe(0)
  })

  it('keeps the signal intact on a temporary failure', async () => {
    const created = await publishPost(makeDraft())
    mockedValidate.mockRejectedValue(new Error('network down'))

    const result = await auditAllSources()
    expect(result.temporarily_unavailable).toBe(1)

    const post = await getPost(created.post.slug)
    expect(post?.sources[0]).toMatchObject({
      url: 'https://example.com/terraform',
      sourceStatus: 'temporarily_unavailable',
    })
    expect(post?.sources[0]?.verifiedAtPublication).toBe(true)
  })

  it('preserves verifiedAtPublication when a later audit breaks the source', async () => {
    const created = await publishPost(makeDraft())
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([['timestamp', 'original', 'statuscode']]), { status: 200 }),
    )
    mockedValidate.mockRejectedValue(
      new SourceRejectedError('Source rejected: http 404', brokenCheck('https://example.com/terraform')),
    )

    await auditAllSources()

    const post = await getPost(created.post.slug)
    expect(post?.sources[0]).toMatchObject({
      sourceStatus: 'broken',
      verifiedAtPublication: true,
      lastSuccessfulAt: expect.any(String),
    })
  })

  it('replaces a broken source with a valid archived copy', async () => {
    await publishPost(makeDraft())
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          ['timestamp', 'original', 'statuscode'],
          ['20260101120000', 'https://example.com/terraform', '200'],
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    mockedValidate
      .mockRejectedValueOnce(
        new SourceRejectedError('Source rejected: http 404', brokenCheck('https://example.com/terraform')),
      )
      .mockResolvedValueOnce({
        ...validCheck('https://web.archive.org/web/20260101120000/https://example.com/terraform'),
        pageTitle: 'Terraform changelog',
      })

    const result = await auditAllSources()

    expect(result.replacements).toBe(1)
    expect(result.replaced).toBe(1)
    expect(result.replacementCandidates).toBe(0)

    const post = await getPost('devops-terraform-corrige-regressao-de-plan-2026-08-12')
    const source = post?.sources[0]
    expect(source).toMatchObject({
      url: 'https://web.archive.org/web/20260101120000/https://example.com/terraform',
      sourceStatus: 'replaced',
    })
    expect(source?.replacements ?? []).toEqual([
      {
        oldUrl: 'https://example.com/terraform',
        newUrl: 'https://web.archive.org/web/20260101120000/https://example.com/terraform',
        replacedAt: expect.any(String),
        reason: 'recovered from Internet Archive',
      },
    ])
  })

  it('flags a never-existing source without replacing it', async () => {
    await publishPost(makeDraft())
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([['timestamp', 'original', 'statuscode']]), { status: 200 }),
    )
    mockedValidate.mockRejectedValue(
      new SourceRejectedError('Source rejected: http 404', brokenCheck('https://example.com/terraform')),
    )

    const result = await auditAllSources()

    expect(result.replacementCandidates).toBe(1)
    expect(result.replacements).toBe(0)

    const post = await getPost('devops-terraform-corrige-regressao-de-plan-2026-08-12')
    expect(post?.sources[0]).toMatchObject({
      sourceStatus: 'broken',
      url: 'https://example.com/terraform',
    })
  })
})

describe('discoverArchivedCopy', () => {
  it('builds a snapshot URL from CDX data', async () => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          ['timestamp', 'original', 'statuscode'],
          ['20260101120000', 'https://example.com/terraform', '200'],
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const { discoverArchivedCopy } = await import('../src/publishing/audit-sources')
    const url = await discoverArchivedCopy('https://example.com/terraform')
    expect(url).toBe('https://web.archive.org/web/20260101120000/https://example.com/terraform')
  })

  it('returns null when CDX has no snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([['timestamp', 'original', 'statuscode']]), { status: 200 }),
    )

    const { discoverArchivedCopy } = await import('../src/publishing/audit-sources')
    expect(await discoverArchivedCopy('https://example.com/never-existed')).toBeNull()
  })

  it('returns null when the archive API fails', async () => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(fetch).mockRejectedValue(new Error('archive down'))

    const { discoverArchivedCopy } = await import('../src/publishing/audit-sources')
    expect(await discoverArchivedCopy('https://example.com/terraform')).toBeNull()
  })
})
