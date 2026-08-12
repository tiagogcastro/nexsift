import { describe, expect, it } from 'vitest'
import { createSlug } from '../src/publishing/slug'

describe('createSlug', () => {
  it('creates a lowercase ASCII slug from pt-BR text', () => {
    expect(createSlug('AWS acelera implantação com IA')).toBe(
      'aws-acelera-implantacao-com-ia',
    )
  })

  it('removes repeated separators', () => {
    expect(createSlug('Next.js 16.3: build + cache')).toBe(
      'next-js-16-3-build-cache',
    )
  })
})
