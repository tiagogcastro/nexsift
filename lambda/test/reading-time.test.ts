import { describe, expect, it } from 'vitest'
import { calculateReadingTime } from '../src/publishing/reading-time'

describe('calculateReadingTime', () => {
  it('returns at least one minute', () => {
    expect(calculateReadingTime('Texto curto.')).toBe(1)
  })

  it('rounds reading time up', () => {
    expect(calculateReadingTime(Array.from({ length: 201 }, () => 'word').join(' '))).toBe(2)
  })
})
