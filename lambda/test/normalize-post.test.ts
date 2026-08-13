import { postDraftSchema } from '@nexsift/schemas/post'
import { normalizePost } from '../src/publishing/normalize-post'
import { describe, expect, it } from 'vitest'

const now = new Date('2026-08-13T09:00:00.000Z')

function makeDraft() {
  return postDraftSchema.parse({
    title: 'Kubernetes 1.36 remove API legada',
    description: 'A release remove endpoints deprecados há vários ciclos.',
    content:
      '## O sinal\n\nO Kubernetes 1.36 foi lançado.\n\n## O que mudou\n\nAPIs legadas foram removidas.\n\n## O que fazer\n\nRevise seus manifests para as APIs estáveis.',
    whyItMatters: 'Manifests usando APIs antigas quebram na atualização.',
    topics: ['devops', 'cloud'],
    signalDate: '2026-08-12',
    signalType: 'release',
    depth: 'practical',
    sources: [
      {
        title: 'Kubernetes 1.36 changelog',
        publisher: 'Kubernetes',
        url: 'https://example.com/k8s',
      },
    ],
    relevanceScore: 7.8,
    confidenceScore: 8.5,
  })
}

describe('normalizePost', () => {
  it('creates a new post with a computed slug', () => {
    const post = normalizePost(makeDraft(), null, now)

    expect(post.slug).toBe('devops-kubernetes-1-36-remove-api-legada-2026-08-12')
    expect(post.id).toBe('post_devops-kubernetes-1-36-remove-api-legada-2026-08-12')
    expect(post.publishedAt).toBe('2026-08-13T09:00:00.000Z')
    expect(post.updatedAt).toBeUndefined()
    expect(post.signalDate).toBe('2026-08-12')
  })

  it('preserves id and publishedAt when updating an existing post', () => {
    const existing = normalizePost(makeDraft(), null, now)
    const updated = normalizePost(makeDraft(), existing, now)

    expect(updated.id).toBe(existing.id)
    expect(updated.publishedAt).toBe(existing.publishedAt)
    expect(updated.updatedAt).toBe('2026-08-13T09:00:00.000Z')
  })

  it('normalizes tags', () => {
    const post = normalizePost(
      { ...makeDraft(), tags: ['K8s', ' k8s ', ''] },
      null,
      now,
    )

    expect(post.tags).toEqual(['k8s'])
  })
})
