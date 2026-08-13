import {
  postDraftSchema,
  postSchema,
  postSummarySchema,
  type PostDraft,
} from '@nexsift/schemas/post'
import { topicSchema } from '@nexsift/schemas/topic'
import { describe, expect, it } from 'vitest'

function makeDraft(overrides: Partial<PostDraft> & { type?: never } = {}): PostDraft {
  return {
    title: 'OpenSSL lança correção de vulnerabilidade crítica',
    description: 'Uma nova atualização corrige uma falha explorável em produção.',
    content:
      '## O sinal\n\nA OpenSSL publicou uma atualização de segurança.\n\n## O que mudou\n\nA correção fecha uma falha remota.',
    whyItMatters:
      'Servidores expostos precisam atualizar antes que a falha seja explorada em larga escala.',
    topics: ['security'],
    signalDate: '2026-08-11',
    signalType: 'risk',
    depth: 'practical',
    tags: ['openssl'],
    sources: [
      {
        title: 'OpenSSL Security Advisory',
        publisher: 'OpenSSL',
        url: 'https://example.com/advisory',
      },
    ],
    relevanceScore: 8.4,
    confidenceScore: 9,
    ...overrides,
  }
}

describe('topicSchema', () => {
  it('accepts the seven official topics', () => {
    for (const topic of [
      'ai',
      'development',
      'cloud',
      'devops',
      'security',
      'industry',
      'design',
    ]) {
      expect(topicSchema.safeParse(topic).success).toBe(true)
    }
  })

  it('rejects removed topics', () => {
    expect(topicSchema.safeParse('career').success).toBe(false)
    expect(topicSchema.safeParse('finance').success).toBe(false)
  })
})

describe('postDraftSchema', () => {
  it('parses a valid draft', () => {
    expect(postDraftSchema.safeParse(makeDraft()).success).toBe(true)
  })

  it('requires a date-only signalDate', () => {
    const withDatetime = postDraftSchema.safeParse(
      makeDraft({ signalDate: '2026-08-11T10:00:00Z' }),
    )
    expect(withDatetime.success).toBe(false)
  })

  it('rejects a slug that does not match topic and signalDate', () => {
    const wrongTopic = postDraftSchema.safeParse(
      makeDraft({ slug: 'devops-openssl-2026-08-11' }),
    )
    expect(wrongTopic.success).toBe(false)

    const wrongDate = postDraftSchema.safeParse(
      makeDraft({ slug: 'security-openssl-2026-08-12' }),
    )
    expect(wrongDate.success).toBe(false)
  })

  it('accepts a slug starting with {topics[0]}- and ending with -{signalDate}', () => {
    expect(
      postDraftSchema.safeParse(
        makeDraft({ slug: 'security-openssl-2026-08-11' }),
      ).success,
    ).toBe(true)
  })

  it('requires signalType, depth and confidenceScore', () => {
    expect(
      postDraftSchema.safeParse(
        makeDraft({ signalType: undefined as never }),
      ).success,
    ).toBe(false)
    expect(
      postDraftSchema.safeParse(makeDraft({ confidenceScore: 11 })).success,
    ).toBe(false)
  })

  it('strips the legacy type field', () => {
    const parsed = postDraftSchema.parse(
      makeDraft({ type: 'article' as never }),
    )
    expect('type' in parsed).toBe(false)
  })
})

describe('postSchema', () => {
  it('rejects slugs with an arbitrary suffix', () => {
    const draft = postDraftSchema.parse(makeDraft())
    const post = { ...draft, id: 'post_1', slug: 'devops-2026-07-16-gitlab' }
    expect(postSchema.safeParse(post).success).toBe(false)
  })
})

describe('postSummarySchema', () => {
  it('carries sources and the new classification fields', () => {
    const draft = postDraftSchema.parse(makeDraft())
    const summary = postSummarySchema.parse({
      ...draft,
      id: 'post_1',
      slug: 'security-openssl-2026-08-11',
      publishedAt: '2026-08-11T12:00:00.000Z',
      readingTime: 3,
      locale: 'pt-BR',
      featured: false,
    })
    expect(summary.sources).toHaveLength(1)
    expect(summary.signalType).toBe('risk')
    expect(summary.depth).toBe('practical')
    expect(summary.confidenceScore).toBe(9)
  })
})
