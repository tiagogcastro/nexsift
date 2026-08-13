import { postDraftSchema } from '@nexsift/schemas/post'
import {
  deletePost,
  latestIndexKey,
  NotFoundError,
  publishPost,
} from '../src/publishing/publish-post'
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

beforeEach(() => {
  store.clear()
  vi.stubEnv('CONTENT_BUCKET', 'test-bucket')
  vi.stubEnv('AWS_REGION', 'us-east-1')
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
