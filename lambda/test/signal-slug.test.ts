import { buildSignalSlug } from '../src/publishing/signal-slug'
import { describe, expect, it } from 'vitest'

describe('buildSignalSlug', () => {
  it('combines topic, slugified title and signal date', () => {
    expect(buildSignalSlug('devops', 'Nova release do Terraform', '2026-07-16')).toBe(
      'devops-nova-release-do-terraform-2026-07-16',
    )
  })

  it('normalizes diacritics', () => {
    expect(buildSignalSlug('ai', 'Geração aumentada', '2026-07-16')).toBe(
      'ai-geracao-aumentada-2026-07-16',
    )
  })

  it('truncates long titles to keep the slug compact', () => {
    expect(buildSignalSlug('devops', 'a'.repeat(60), '2026-07-16')).toBe(
      `devops-${'a'.repeat(40)}-2026-07-16`,
    )
  })
})
