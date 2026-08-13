import {
  classifySourceCheck,
  isPrivateAddress,
  SourceRejectedError,
  validateSourceUrl,
} from '../src/publishing/validate-source'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dnsLookup } = vi.hoisted(() => ({
  dnsLookup: vi.fn(),
}))

vi.mock('node:dns/promises', () => ({
  lookup: dnsLookup,
}))

function htmlResponse(title: string, status = 200) {
  return new Response(`<html><head><title>${title}</title></head>`, {
    status,
    headers: { 'content-type': 'text/html' },
  })
}

function redirectResponse(location: string, status = 302) {
  return new Response(null, {
    status,
    headers: { location },
  })
}

describe('isPrivateAddress', () => {
  it('blocks loopback, private and link-local ranges', () => {
    expect(isPrivateAddress('127.0.0.1')).toBe(true)
    expect(isPrivateAddress('127.8.8.8')).toBe(true)
    expect(isPrivateAddress('10.0.0.1')).toBe(true)
    expect(isPrivateAddress('172.16.0.1')).toBe(true)
    expect(isPrivateAddress('172.31.255.255')).toBe(true)
    expect(isPrivateAddress('192.168.0.1')).toBe(true)
    expect(isPrivateAddress('169.254.169.254')).toBe(true)
    expect(isPrivateAddress('0.0.0.0')).toBe(true)
    expect(isPrivateAddress('::1')).toBe(true)
    expect(isPrivateAddress('fe80::1')).toBe(true)
    expect(isPrivateAddress('fc00::1')).toBe(true)
  })

  it('allows public addresses', () => {
    expect(isPrivateAddress('8.8.8.8')).toBe(false)
    expect(isPrivateAddress('1.1.1.1')).toBe(false)
    expect(isPrivateAddress('142.250.72.14')).toBe(false)
    expect(isPrivateAddress('2606:4700:4700::1111')).toBe(false)
  })
})

describe('validateSourceUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    dnsLookup.mockReset()
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
  })

  it('accepts a healthy 200 with title', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Real Article Title'))

    const check = await validateSourceUrl('https://example.com/article')

    expect(check.ok).toBe(true)
    expect(check.status).toBe(200)
    expect(check.pageTitle).toBe('Real Article Title')
    expect(check.sourceStatus).toBe('healthy')
    expect(check.finalUrl).toBe('https://example.com/article')
  })

  it('rejects a 404', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Not found', 404))

    await expect(
      validateSourceUrl('https://example.com/missing'),
    ).rejects.toBeInstanceOf(SourceRejectedError)

    await validateSourceUrl('https://example.com/missing').catch((error) => {
      expect(error.check.sourceStatus).toBe('broken')
    })
  })

  it('rejects a soft-404 that returns 200', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('404 - Page not found'))

    await validateSourceUrl('https://example.com/invented').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
    })
  })

  it('rejects a redirect to the homepage', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(redirectResponse('https://example.com/'))
      .mockResolvedValueOnce(htmlResponse('Example Homepage'))

    await validateSourceUrl(
      'https://example.com/blog/some/deep-article',
    ).catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
    })
  })

  it('allows a redirect to a valid article', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(redirectResponse('https://www.example.com/article'))
      .mockResolvedValueOnce(htmlResponse('Real Article Title'))

    const check = await validateSourceUrl('https://example.com/article')

    expect(check.ok).toBe(true)
    expect(check.finalUrl).toBe('https://www.example.com/article')
    expect(check.sourceStatus).toBe('redirected')
  })

  it('rejects a 500 with temporarily_unavailable', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Error', 500))

    await validateSourceUrl('https://example.com/article').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('temporarily_unavailable')
    })
  })

  it('classifies a 403 anti-bot response as blocked', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Access denied', 403))

    await validateSourceUrl('https://example.com/article').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('blocked')
      expect(error.check.status).toBe(403)
    })
  })

  it('rejects a 410 as broken', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Gone', 410))

    await validateSourceUrl('https://example.com/removed').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
    })
  })

  it('rejects a 429 as temporarily_unavailable', async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse('Too many requests', 429))

    await validateSourceUrl('https://example.com/article').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('temporarily_unavailable')
    })
  })

  it('rejects a network failure as temporarily_unavailable', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    await validateSourceUrl('https://example.com/article').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('temporarily_unavailable')
      expect(error.check.status).toBe(0)
    })
  })

  it('rejects SSRF to loopback even via DNS', async () => {
    dnsLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }])

    await validateSourceUrl('https://internal.example.com').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  it('rejects SSRF after redirect to a private host', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(redirectResponse('https://169.254.169.254/latest/meta-data/'))

    await validateSourceUrl('https://example.com/redirect').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
    })
  })

  it('rejects non-http protocols', async () => {
    await validateSourceUrl('file:///etc/passwd').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
    })
  })

  it('rejects malformed URLs', async () => {
    await validateSourceUrl('not a url').catch((error) => {
      expect(error).toBeInstanceOf(SourceRejectedError)
      expect(error.check.sourceStatus).toBe('broken')
    })
  })
})

describe('classifySourceCheck', () => {
  const base = {
    ok: true,
    requestedUrl: 'https://example.com/a',
    finalUrl: 'https://example.com/a',
    status: 200,
    checkedAt: '2026-08-13T00:00:00.000Z',
    pageTitle: null,
    contentType: 'text/html',
  }

  it('returns healthy for a clean 200', () => {
    expect(classifySourceCheck({ ...base, sourceStatus: 'healthy' })).toBe(
      'healthy',
    )
  })

  it('returns redirected when finalUrl differs', () => {
    expect(
      classifySourceCheck({
        ...base,
        finalUrl: 'https://www.example.com/a',
        sourceStatus: 'redirected',
      }),
    ).toBe('redirected')
  })
})
