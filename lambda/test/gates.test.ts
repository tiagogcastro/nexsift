import { validateEditorialGates } from '../src/publishing/gates'
import { postDraftSchema } from '@nexsift/schemas/post'
import { describe, expect, it } from 'vitest'

function draftWith(relevanceScore: number, confidenceScore: number) {
  return postDraftSchema.parse({
    title: 'Título longo o suficiente para o teste de gates',
    description: 'Descrição com mais de trinta caracteres para o teste.',
    content:
      '## O sinal\n\nConteúdo com mais de cem caracteres para satisfazer o schema.\n\n## O que mudou\n\nDetalhes do acontecimento.',
    whyItMatters: 'Por que isso importa para quem constrói tecnologia.',
    topics: ['ai'],
    signalDate: '2026-08-12',
    signalType: 'release',
    depth: 'practical',
    sources: [
      {
        title: 'Source',
        publisher: 'Publisher',
        url: 'https://example.com',
      },
    ],
    relevanceScore,
    confidenceScore,
  })
}

describe('validateEditorialGates', () => {
  it('rejects high relevance with low confidence', () => {
    expect(validateEditorialGates(draftWith(9.2, 5.4))).toEqual([
      { path: 'confidenceScore', message: 'confidenceScore must be at least 7' },
    ])
  })

  it('rejects low relevance', () => {
    expect(validateEditorialGates(draftWith(5, 9))).toEqual([
      { path: 'relevanceScore', message: 'relevanceScore must be at least 6.5' },
    ])
  })

  it('accepts scores on the thresholds', () => {
    expect(validateEditorialGates(draftWith(6.5, 7))).toEqual([])
  })
})
