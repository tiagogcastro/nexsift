import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EditorialLink } from '../src/features/blog/editorial-link'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('EditorialLink', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://nexsift.com')
  })

  it('opens external links in a new tab with noopener', () => {
    const html = renderToStaticMarkup(
      h(
        EditorialLink,
        { href: 'https://github.blog/changelog/' },
        'fonte',
      ),
    )

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('keeps internal links in the same tab', () => {
    const html = renderToStaticMarkup(
      h(EditorialLink, { href: '/blog/ai-sinal-2026-08-13' }, 'sinal'),
    )

    expect(html).not.toContain('target="_blank"')
    expect(html).not.toContain('rel=')
  })

  it('treats same-origin links as internal', () => {
    const html = renderToStaticMarkup(
      h(EditorialLink, { href: 'https://nexsift.com/blog' }, 'sinal'),
    )

    expect(html).not.toContain('target="_blank"')
  })
})
