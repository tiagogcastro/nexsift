import { describe, expect, it } from 'vitest'
import type { PostSummary } from '@nexsift/schemas/post'
import type { VerifiedPostSource } from '@nexsift/schemas/source'
import {
  isSourceCurrentlyVerifiable,
  isSourcePublicationVerified,
  publicationVerifiedSourcesRatio,
  sourceStatusLabelKey,
  verifiableSourcesRatio,
} from '../src/lib/source-verification'

function source(overrides: Partial<VerifiedPostSource> = {}): VerifiedPostSource {
  return {
    title: 'Source',
    publisher: 'Publisher',
    url: 'https://example.com',
    ...overrides,
  }
}

function signal(sources: VerifiedPostSource[]): PostSummary {
  return {
    id: 'post_1',
    slug: 'ai-test-2026-08-12',
    title: 'Sinal de teste',
    description: 'Descrição com mais de trinta caracteres para o teste.',
    topics: ['ai'],
    tags: [],
    signalDate: '2026-08-12',
    publishedAt: '2026-08-12T10:00:00.000Z',
    readingTime: 2,
    relevanceScore: 8,
    confidenceScore: 8,
    signalType: 'release',
    depth: 'practical',
    featured: false,
    locale: 'pt-BR',
    sources,
  }
}

describe('isSourceCurrentlyVerifiable', () => {
  it('accepts healthy and redirected', () => {
    expect(isSourceCurrentlyVerifiable(source({ sourceStatus: 'healthy' }))).toBe(true)
    expect(isSourceCurrentlyVerifiable(source({ sourceStatus: 'redirected' }))).toBe(true)
  })

  it('accepts replaced sources with a successful check', () => {
    expect(
      isSourceCurrentlyVerifiable(
        source({ sourceStatus: 'replaced', lastSuccessfulAt: '2026-08-20T10:00:00.000Z' }),
      ),
    ).toBe(true)
  })

  it('rejects broken, temporary, blocked and unknown', () => {
    expect(isSourceCurrentlyVerifiable(source({ sourceStatus: 'broken' }))).toBe(false)
    expect(isSourceCurrentlyVerifiable(source({ sourceStatus: 'temporarily_unavailable' }))).toBe(false)
    expect(isSourceCurrentlyVerifiable(source({ sourceStatus: 'blocked' }))).toBe(false)
    expect(isSourceCurrentlyVerifiable(undefined)).toBe(false)
  })
})

describe('isSourcePublicationVerified', () => {
  it('accepts only sources verified at publication', () => {
    expect(isSourcePublicationVerified(source({ verifiedAtPublication: true }))).toBe(true)
    expect(isSourcePublicationVerified(source({ verifiedAtPublication: false }))).toBe(false)
    expect(isSourcePublicationVerified(source({ sourceStatus: 'healthy' }))).toBe(false)
  })
})

describe('ratios', () => {
  it('computes 100% when every source is healthy', () => {
    const signals = [
      signal([source({ sourceStatus: 'healthy' }), source({ sourceStatus: 'redirected' })]),
    ]
    expect(verifiableSourcesRatio(signals)).toBe(1)
  })

  it('computes 50% when one of two sources is broken', () => {
    const signals = [
      signal([source({ sourceStatus: 'healthy' }), source({ sourceStatus: 'broken' })]),
    ]
    expect(verifiableSourcesRatio(signals)).toBe(0.5)
  })

  it('counts legacy sources without metadata as not verifiable', () => {
    const signals = [signal([source({}), source({ sourceStatus: 'healthy' })])]
    expect(verifiableSourcesRatio(signals)).toBe(0.5)
  })

  it('counts publication verification separately', () => {
    const signals = [
      signal([
        source({ sourceStatus: 'broken', verifiedAtPublication: true }),
        source({ sourceStatus: 'healthy', verifiedAtPublication: false }),
      ]),
    ]
    expect(publicationVerifiedSourcesRatio(signals)).toBe(0.5)
  })

  it('returns 0 for empty signals', () => {
    expect(verifiableSourcesRatio([])).toBe(0)
    expect(publicationVerifiedSourcesRatio([])).toBe(0)
  })
})

describe('sourceStatusLabelKey', () => {
  it('maps broken with history to linkRot', () => {
    expect(
      sourceStatusLabelKey(source({ sourceStatus: 'broken', lastSuccessfulAt: '2026-08-13T10:00:00.000Z' })),
    ).toBe('linkRot')
  })

  it('maps broken without history to compromised', () => {
    expect(sourceStatusLabelKey(source({ sourceStatus: 'broken' }))).toBe('compromised')
  })

  it('maps the other states to their keys', () => {
    expect(sourceStatusLabelKey(source({ sourceStatus: 'healthy' }))).toBe('healthy')
    expect(sourceStatusLabelKey(source({ sourceStatus: 'redirected' }))).toBe('redirected')
    expect(sourceStatusLabelKey(source({ sourceStatus: 'replaced' }))).toBe('replaced')
    expect(sourceStatusLabelKey(source({ sourceStatus: 'temporarily_unavailable' }))).toBe(
      'temporarilyUnavailable',
    )
    expect(sourceStatusLabelKey(source({ sourceStatus: 'blocked' }))).toBe('blocked')
    expect(sourceStatusLabelKey(undefined)).toBe('unknown')
  })
})
