import { postSummarySchema, type PostSummary } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { dailySeed, selectHomeSignals } from '../src/lib/home-selection'
import { beforeEach, describe, expect, it } from 'vitest'

let counter = 0

function makePost(
  topics: [Topic, ...Topic[]],
  relevanceScore: number,
  publishedAt = '2026-08-12T10:00:00.000Z',
): PostSummary {
  counter += 1
  const day = String((counter % 28) + 1).padStart(2, '0')
  const slug = `${topics[0]}-sinal-de-teste-${counter}-2026-08-${day}`

  return postSummarySchema.parse({
    id: `post_${counter}`,
    slug,
    title: `Sinal de teste ${counter}`,
    description: 'Descrição de teste com mais de trinta caracteres.',
    topics,
    tags: [],
    signalDate: `2026-08-${day}`,
    publishedAt,
    readingTime: 2,
    relevanceScore,
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

beforeEach(() => {
  counter = 0
})

describe('dailySeed', () => {
  it('formats the UTC date as YYYY-MM-DD', () => {
    expect(dailySeed(new Date('2026-08-13T21:00:00.000Z'))).toBe('2026-08-13')
  })
})

describe('selectHomeSignals', () => {
  it('never exceeds the limit', () => {
    const topics = ['devops', 'ai', 'cloud'] as Topic[]
    const posts = Array.from({ length: 12 }, (_, index) =>
      makePost([topics[index % 3] ?? 'devops'], 7 + index / 10),
    )

    expect(selectHomeSignals(posts, { limit: 5 })).toHaveLength(5)
  })

  it('caps a single topic at two signals', () => {
    const posts = Array.from({ length: 6 }, (_, index) =>
      makePost(['devops'], 9 - index / 10),
    )

    const selected = selectHomeSignals(posts, { limit: 5 })
    const devopsCount = selected.filter((post) =>
      post.topics.includes('devops'),
    ).length

    expect(devopsCount).toBeLessThanOrEqual(2)
  })

  it('prioritizes topic diversity among top candidates', () => {
    const posts = [
      makePost(['ai'], 9.5),
      makePost(['cloud'], 9.4),
      makePost(['development'], 9.3),
      makePost(['devops'], 9.2),
      makePost(['security'], 9.1),
      makePost(['ai'], 8.9),
      makePost(['cloud'], 8.8),
    ]

    const selected = selectHomeSignals(posts, { limit: 5 })
    const primaryTopics = selected.map((post) => post.topics[0])

    expect(new Set(primaryTopics).size).toBe(5)
  })

  it('fills remaining slots with seconds when topics run out', () => {
    const posts = [
      makePost(['ai'], 9.5),
      makePost(['cloud'], 9.4),
      makePost(['ai'], 9.3),
      makePost(['cloud'], 9.2),
    ]

    const selected = selectHomeSignals(posts, { limit: 4 })
    expect(selected).toHaveLength(4)

    const aiCount = selected.filter((post) => post.topics[0] === 'ai').length
    expect(aiCount).toBeLessThanOrEqual(2)
  })

  it('is deterministic for the same seed', () => {
    const posts = Array.from({ length: 20 }, (_, index) =>
      makePost(
        [['ai', 'cloud', 'development', 'devops', 'security'][index % 5]] as [
          Topic,
          ...Topic[],
        ],
        6.5 + (index % 10) / 10,
      ),
    )

    const first = selectHomeSignals(posts, { seed: '2026-08-13' })
    const second = selectHomeSignals(posts, { seed: '2026-08-13' })

    expect(first.map((post) => post.slug)).toEqual(
      second.map((post) => post.slug),
    )
  })

  it('returns an empty selection for an empty pool', () => {
    expect(selectHomeSignals([])).toEqual([])
  })
})
