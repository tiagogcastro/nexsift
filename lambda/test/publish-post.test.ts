import { postDraftSchema } from '@nexsift/schemas/post'
import {
  deletePost,
  latestIndexKey,
  NotFoundError,
  publishPost,
  replacePostSource,
} from '../src/publishing/publish-post'
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
    checkedAt: '2026-08-13T12:00:00.000Z',
    pageTitle: 'Terraform changelog',
    contentType: 'text/html',
    sourceStatus: 'healthy' as const,
  }
}

beforeEach(() => {
  store.clear()
  vi.stubEnv('CONTENT_BUCKET', 'test-bucket')
  vi.stubEnv('AWS_REGION', 'us-east-1')
  mockedValidate.mockReset()
  mockedValidate.mockImplementation((url: string) =>
    Promise.resolve(validCheck(url)),
  )
})

function makeDraft(signalDate = '2026-08-12', topics = ['devops'] as string[]) {
  return postDraftSchema.parse({
    title: 'Terraform corrige regressão de plan',
    description: 'Atualização importante para quem usa módulos compartilhados.',
    content:
      '## O sinal\n\nO Terraform publicou uma nova release.\n\n## O que mudou\n\nCorrige uma regressão na fase de plan.',
    whyItMatters: 'Atualize antes de aplicar mudanças em produção.',
    topics,
    signalDate,
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

describe('publishPost', () => {
  it('creates a post and updates all indexes', async () => {
    const result = await publishPost(makeDraft())

    expect(result.operation).toBe('created')
    expect(result.post.slug).toBe('devops-terraform-corrige-regressao-de-plan-2026-08-12')

    const latest = await getIndex(latestIndexKey)
    expect(latest).toHaveLength(1)
    expect(latest[0]?.slug).toBe('devops-terraform-corrige-regressao-de-plan-2026-08-12')

    const topicIndex = await getIndex('public/indexes/topics/devops.json')
    expect(topicIndex).toHaveLength(1)
  })

  it('updates an existing signal with the same slug', async () => {
    const first = await publishPost(makeDraft())
    const second = await publishPost(makeDraft())

    expect(second.operation).toBe('updated')
    expect(second.post.id).toBe(first.post.id)
    expect(second.post.publishedAt).toBe(first.post.publishedAt)

    const latest = await getIndex(latestIndexKey)
    expect(latest).toHaveLength(1)
  })

  it('removes a dropped topic from its index on update', async () => {
    await publishPost(makeDraft('2026-08-12', ['devops', 'cloud']))
    await publishPost(makeDraft('2026-08-12', ['devops']))

    const cloudIndex = await getIndex('public/indexes/topics/cloud.json')
    expect(cloudIndex).toHaveLength(0)
  })
})

describe('source verification on publish', () => {
  it('stores verification fields on every published source', async () => {
    await publishPost(makeDraft())

    const post = await getPost('devops-terraform-corrige-regressao-de-plan-2026-08-12')
    const source = post?.sources[0]

    expect(source).toMatchObject({
      url: 'https://example.com/terraform',
      lastCheckedAt: expect.any(String),
      lastSuccessfulAt: expect.any(String),
      httpStatus: 200,
      finalUrl: 'https://example.com/terraform',
      sourceStatus: 'healthy',
    })
  })

  it('rejects publication when any source is broken', async () => {
    const check = validCheck('https://example.com/terraform')
    mockedValidate.mockRejectedValueOnce(
      new SourceRejectedError(
        'Source rejected: http 404',
        { ...check, ok: false, status: 404, sourceStatus: 'broken' },
      ),
    )

    await expect(publishPost(makeDraft())).rejects.toMatchObject({
      name: 'SourceRejectedError',
      failures: [
        { url: 'https://example.com/terraform', status: 404, sourceStatus: 'broken' },
      ],
    })
  })

  it('rejects publication when the source times out', async () => {
    const check = validCheck('https://example.com/terraform')
    mockedValidate.mockRejectedValueOnce(
      new SourceRejectedError(
        'Source rejected: http 0',
        { ...check, ok: false, status: 0, sourceStatus: 'temporarily_unavailable' },
      ),
    )

    await expect(publishPost(makeDraft())).rejects.toMatchObject({
      name: 'SourceRejectedError',
    })
  })
})

describe('publication verification gate', () => {
  it('rejects a source without an editorial assertion', async () => {
    const draft = makeDraft()
    draft.sources = [
      { title: 'Terraform changelog', publisher: 'HashiCorp', url: 'https://example.com/terraform' },
    ]

    await expect(publishPost(draft)).rejects.toMatchObject({
      name: 'SourceRejectedError',
    })
  })

  it('rejects a source asserted unverified', async () => {
    const draft = makeDraft()
    draft.sources = [
      {
        title: 'Terraform changelog',
        publisher: 'HashiCorp',
        url: 'https://example.com/terraform',
        editorialStatus: 'unverified',
      },
    ]

    await expect(publishPost(draft)).rejects.toMatchObject({
      name: 'SourceRejectedError',
    })
  })

  it('records publication verification on every accepted source', async () => {
    await publishPost(makeDraft())

    const post = await getPost('devops-terraform-corrige-regressao-de-plan-2026-08-12')
    expect(post?.sources[0]).toMatchObject({
      verifiedAtPublication: true,
      firstVerifiedAt: expect.any(String),
      editorialStatus: 'verified',
      editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      sourceStatus: 'healthy',
    })
  })

  it('publishes with two healthy sources and records both', async () => {
    const draft = makeDraft()
    draft.sources = [
      {
        title: 'Terraform changelog',
        publisher: 'HashiCorp',
        url: 'https://example.com/terraform',
        editorialStatus: 'verified',
        editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      },
      {
        title: 'HashiCorp blog',
        publisher: 'HashiCorp',
        url: 'https://example.com/blog',
        editorialStatus: 'verified',
        editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      },
    ]

    const result = await publishPost(draft)

    expect(result.post.sources).toHaveLength(2)
    expect(result.post.sources.every((source) => source.verifiedAtPublication === true)).toBe(true)
  })

  it('rejects when one of two sources is broken', async () => {
    const draft = makeDraft()
    draft.sources = [
      {
        title: 'Terraform changelog',
        publisher: 'HashiCorp',
        url: 'https://example.com/terraform',
        editorialStatus: 'verified',
        editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      },
      {
        title: 'HashiCorp blog',
        publisher: 'HashiCorp',
        url: 'https://example.com/blog',
        editorialStatus: 'verified',
        editoriallyVerifiedAt: '2026-08-13T12:00:00.000Z',
      },
    ]
    mockedValidate
      .mockResolvedValueOnce(validCheck('https://example.com/terraform'))
      .mockRejectedValueOnce(
        new SourceRejectedError('Source rejected: http 404', {
          ...validCheck('https://example.com/blog'),
          ok: false,
          status: 404,
          sourceStatus: 'broken',
        }),
      )

    await expect(publishPost(draft)).rejects.toMatchObject({
      name: 'SourceRejectedError',
      failures: [{ url: 'https://example.com/blog', status: 404, sourceStatus: 'broken' }],
    })
  })
})

describe('replacePostSource', () => {
  it('replaces a source, keeps history and refreshes the index', async () => {
    const created = await publishPost(makeDraft())
    mockedValidate.mockResolvedValue(validCheck('https://example.com/terraform-new'))

    const updated = await replacePostSource(
      created.post.slug,
      0,
      'https://example.com/terraform-new',
      'link rot',
    )

    const source = updated.sources[0]
    expect(source?.url).toBe('https://example.com/terraform-new')
    expect(source?.sourceStatus).toBe('replaced')
    expect(source?.replacements ?? []).toEqual([
      {
        oldUrl: 'https://example.com/terraform',
        newUrl: 'https://example.com/terraform-new',
        replacedAt: expect.any(String),
        reason: 'link rot',
      },
    ])

    const latest = await getIndex(latestIndexKey)
    expect(latest[0]?.sources[0]?.url).toBe('https://example.com/terraform-new')
  })

  it('rejects a replacement whose new URL fails validation', async () => {
    const created = await publishPost(makeDraft())
    mockedValidate.mockRejectedValue(
      new SourceRejectedError('Source rejected: http 404', {
        ...validCheck('https://example.com/terraform-new'),
        ok: false,
        status: 404,
        sourceStatus: 'broken',
      }),
    )

    await expect(
      replacePostSource(created.post.slug, 0, 'https://example.com/terraform-new', 'link rot'),
    ).rejects.toBeInstanceOf(SourceRejectedError)
  })
})

describe('deletePost', () => {
  it('deletes the object and cleans both indexes', async () => {
    await publishPost(makeDraft())
    const result = await deletePost('devops-terraform-corrige-regressao-de-plan-2026-08-12')

    expect(result.slug).toBe('devops-terraform-corrige-regressao-de-plan-2026-08-12')
    expect(typeof result.deletedAt).toBe('string')

    expect(await getPost('devops-terraform-corrige-regressao-de-plan-2026-08-12')).toBeNull()
    expect(await getIndex(latestIndexKey)).toHaveLength(0)
    expect(await getIndex('public/indexes/topics/devops.json')).toHaveLength(0)
  })

  it('throws NotFoundError for unknown slugs', async () => {
    await expect(deletePost('ai-2026-01-01')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})
