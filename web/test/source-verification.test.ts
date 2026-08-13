import { postSummarySchema, type PostSummary } from '@nexsift/schemas/post'
import {
  isSourceVerified,
  verifiedSignalsRatio,
} from '../src/lib/source-verification'
import { describe, expect, it } from 'vitest'

let counter = 0

function makePost(
  slug: string,
  sourceStatuses: Array<'healthy' | 'redirected' | 'broken' | undefined>,
): PostSummary {
  counter += 1
  const sources = sourceStatuses.map((status, index) =>
    status === undefined
      ? { title: `Source ${index}`, publisher: 'Publisher', url: `https://example.com/${index}` }
      : {
          title: `Source ${index}`,
          publisher: 'Publisher',
          url: `https://example.com/${index}`,
          lastCheckedAt: '2026-08-13T10:00:00.000Z',
          lastSuccessfulAt: status === 'broken' ? undefined : '2026-08-13T10:00:00.000Z',
          httpStatus: status === 'broken' ? 404 : 200,
          finalUrl: `https://example.com/${index}`,
          sourceStatus: status,
        },
  )

  return postSummarySchema.parse({
    id: `post_${counter}`,
    slug,
    title: `Sinal de teste ${counter}`,
    description: 'Descrição de teste com mais de trinta caracteres.',
    topics: ['ai'],
    tags: [],
    signalDate: '2026-08-13',
    publishedAt: '2026-08-13T10:00:00.000Z',
    readingTime: 2,
    relevanceScore: 8,
    confidenceScore: 8,
    signalType: 'release',
    depth: 'practical',
    featured: false,
    locale: 'pt-BR',
    sources,
  })
}

describe('isSourceVerified', () => {
  it('considers healthy sources verified', () => {
    const post = makePost('ai-1-2026-08-13', ['healthy'])
    expect(isSourceVerified(post.sources[0])).toBe(true)
  })

  it('considers redirected sources verified', () => {
    const post = makePost('ai-1-2026-08-13', ['redirected'])
    expect(isSourceVerified(post.sources[0])).toBe(true)
  })

  it('rejects broken sources', () => {
    const post = makePost('ai-1-2026-08-13', ['broken'])
    expect(isSourceVerified(post.sources[0])).toBe(false)
  })

  it('rejects sources without a verification record', () => {
    const post = makePost('ai-1-2026-08-13', [undefined])
    expect(isSourceVerified(post.sources[0])).toBe(false)
  })
})

describe('verifiedSignalsRatio', () => {
  it('returns 0 for an empty selection', () => {
    expect(verifiedSignalsRatio([])).toBe(0)
  })

  it('returns 100% when all selected signals are fully verified', () => {
    const signals = [
      makePost('ai-1-2026-08-13', ['healthy', 'healthy']),
      makePost('ai-2-2026-08-13', ['healthy']),
    ]
    expect(verifiedSignalsRatio(signals)).toBe(1)
  })

  it('drops to 0% when one signal has a broken source', () => {
    const signals = [
      makePost('ai-1-2026-08-13', ['healthy']),
      makePost('ai-2-2026-08-13', ['healthy', 'broken']),
    ]
    expect(verifiedSignalsRatio(signals)).toBe(0.5)
  })

  it('counts signals without verification records as not verified', () => {
    const signals = [
      makePost('ai-1-2026-08-13', ['healthy']),
      makePost('ai-2-2026-08-13', [undefined]),
    ]
    expect(verifiedSignalsRatio(signals)).toBe(0.5)
  })
})
