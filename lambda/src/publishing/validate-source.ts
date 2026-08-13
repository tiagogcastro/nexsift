import { lookup } from 'node:dns/promises'
import type { SourceStatus } from '@nexsift/schemas/source'

export interface SourceCheck {
  ok: boolean
  requestedUrl: string
  finalUrl: string
  status: number | null
  checkedAt: string
  pageTitle: string | null
  contentType: string | null
  sourceStatus: SourceStatus
}

export class SourceRejectedError extends Error {
  constructor(
    message: string,
    public readonly check: SourceCheck | null,
    public readonly failures: SourceFailure[] = [],
  ) {
    super(message)
    this.name = 'SourceRejectedError'
  }
}

export interface SourceFailure {
  url: string
  status: number | null
  sourceStatus: SourceStatus
}

const defaultTimeoutMs = 10_000
const maxRedirects = 5

const softNotFoundPatterns = [
  /\b404\b/,
  /page not found/i,
  /p[ÃÃ¢]gina n[ãa]o encontrada/i,
  /does not exist/i,
  /no longer exists/i,
  /nothing here/i,
]

// One of the core failure modes found in the audit: a plausible URL that
// resolves to the site homepage instead of the actual article. Treat a
// redirect that lands on a shallower path as a broken source.
function isHomepageShallow(finalPath: string, requestedPath: string) {
  const finalSegments = finalPath.split('/').filter(Boolean)
  const requestedSegments = requestedPath.split('/').filter(Boolean)

  if (finalSegments.length >= requestedSegments.length) {
    return false
  }

  const hasMeaningfulRoot = finalSegments.some(
    (segment) => segment.length > 1 && !/^(blog|news|index|home)$/i.test(segment),
  )

  return !hasMeaningfulRoot
}

export function classifySourceCheck(
  check: SourceCheck,
  extra: {
    soft404?: boolean
    homepageRedirect?: boolean
    blockedRedirect?: boolean
  } = {},
): SourceStatus {
  if (check.status === null || check.status === 0) {
    return 'temporarily_unavailable'
  }

  if (extra.soft404 || extra.homepageRedirect || extra.blockedRedirect) {
    return 'broken'
  }

  if (check.status === 404 || check.status === 410) {
    return 'broken'
  }

  if (check.status >= 500 || check.status === 429) {
    return 'temporarily_unavailable'
  }

  // A 403 usually means the page exists for humans but blocks the checker.
  // It is a limitation of the verification, not evidence the page is gone.
  if (check.status === 403) {
    return 'blocked'
  }

  if (check.status >= 400) {
    return 'broken'
  }

  if (check.finalUrl !== check.requestedUrl) {
    return 'redirected'
  }

  return 'healthy'
}

function softNotFoundTitle(title: string | null) {
  if (!title) {
    return false
  }

  return softNotFoundPatterns.some((pattern) => pattern.test(title))
}

export async function validateSourceUrl(
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<SourceCheck> {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs
  const parsed = parseHttpUrl(url)
  const checkedAt = new Date().toISOString()

  const base: SourceCheck = {
    ok: false,
    requestedUrl: url,
    finalUrl: url,
    status: null,
    checkedAt,
    pageTitle: null,
    contentType: null,
    sourceStatus: 'temporarily_unavailable',
  }

  if (!parsed) {
    return { ...base, sourceStatus: 'broken' }
  }

  try {
    await assertPublicHost(parsed.hostname)
  } catch {
    return { ...base, sourceStatus: 'broken' }
  }

  let currentUrl = url
  let finalStatus: number | null = null
  let finalTitle: string | null = null
  let finalContentType: string | null = null
  let redirected = false
  let redirectBlocked = false

  try {
    for (let attempt = 0; attempt <= maxRedirects; attempt++) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'user-agent':
            'NexSift-Source-Validator/1.0 (+https://nexsift.com)',
          accept: 'text/html,text/plain,application/json',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })

      finalStatus = response.status

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')

        if (!location) {
          finalStatus = 0
          break
        }

        redirected = true
        const nextUrl = new URL(location, currentUrl).toString()
        const nextParsed = parseHttpUrl(nextUrl)

        if (!nextParsed) {
          redirectBlocked = true
          break
        }

        try {
          await assertPublicHost(nextParsed.hostname)
        } catch {
          redirectBlocked = true
          break
        }

        currentUrl = nextUrl
        continue
      }

      finalContentType = response.headers.get('content-type')
      const body = await response.text()

      if (body.length < 40_000) {
        finalTitle = extractPageTitle(body)
      }

      break
    }
  } catch {
    finalStatus = finalStatus ?? null
  }

  const finalParsed = parseHttpUrl(currentUrl)
  const finalPath = finalParsed?.pathname ?? '/'
  const requestedParsed = parseHttpUrl(url)
  const requestedPath = requestedParsed?.pathname ?? '/'
  const homeRedirect = redirected && isHomepageShallow(finalPath, requestedPath)

  const isHttpOk = finalStatus !== null && finalStatus >= 200 && finalStatus < 300
  const soft404 = isHttpOk && softNotFoundTitle(finalTitle)

  const ok = isHttpOk && !soft404 && !homeRedirect && !redirectBlocked

  const status = finalStatus ?? 0

  const check: SourceCheck = {
    ok,
    requestedUrl: url,
    finalUrl: currentUrl,
    status,
    checkedAt,
    pageTitle: finalTitle,
    contentType: finalContentType,
    sourceStatus: 'temporarily_unavailable',
  }

  check.sourceStatus = classifySourceCheck(check, {
    soft404,
    homepageRedirect: homeRedirect,
    blockedRedirect: redirectBlocked,
  })

  if (!ok) {
    const reason = soft404
      ? 'soft-404'
      : homeRedirect
        ? 'redirected to homepage'
        : redirectBlocked
          ? 'redirect to blocked host'
          : `http ${status}`
    throw new SourceRejectedError(`Source rejected: ${reason}`, check)
  }

  return check
}

function parseHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed
      : null
  } catch {
    return null
  }
}

// Blocks DNS resolution to private, loopback and link-local space plus the
// cloud metadata ranges, before any request is made. IP literals are checked
// directly without a DNS roundtrip. Hostnames that resolve to multiple
// addresses are allowed only if every address is public.
async function assertPublicHost(hostname: string) {
  if (isIpLiteral(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error(`Blocked non-public address ${hostname}`)
    }

    return
  }

  const records = await lookup(hostname, { all: true })

  if (records.length === 0) {
    throw new Error('Empty DNS resolution')
  }

  for (const record of records) {
    if (isPrivateAddress(record.address)) {
      throw new Error(`Blocked non-public address ${record.address}`)
    }
  }
}

function isIpLiteral(value: string) {
  return value.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(value)
}

export function isPrivateAddress(address: string) {
  const lower = address.toLowerCase()

  if (lower === '::1') {
    return true
  }

  if (lower.includes(':')) {
    const ipv6 = parseIpv6(lower)

    if (ipv6) {
      const head = ipv6[0] ?? 0
      const second = ipv6[1] ?? 0
      const linkLocal = head === 0xfe80
      const uniqueLocal = (head & 0xfe00) === 0xfc00
      const unspecified = head === 0 && second === 0
      return linkLocal || uniqueLocal || unspecified
    }

    return true
  }

  const parts = lower.split('.').map((part) => Number.parseInt(part, 10))

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true
  }

  const first = parts[0] ?? 0
  const second = parts[1] ?? 0

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first >= 224
  )
}

function parseIpv6(address: string) {
  const suffix = address.indexOf('%')

  if (suffix !== -1) {
    address = address.slice(0, suffix)
  }

  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':')
    const prefix = address.slice(0, lastColon)
    const ipv4 = address.slice(lastColon + 1)
    const ipv4Parts = ipv4.split('.').map((part) => Number.parseInt(part, 10))

    if (ipv4Parts.length !== 4 || ipv4Parts.some((part) => Number.isNaN(part))) {
      return null
    }

    const [a, b, c, d] = ipv4Parts
    const words = expandIpv6(`${prefix}::`.split(':'))
    const tail = [((a ?? 0) << 8) | (b ?? 0), ((c ?? 0) << 8) | (d ?? 0)]

    return [...words, ...tail]
  }

  return expandIpv6(address.split(':'))
}

function expandIpv6(words: string[]) {
  const result: number[] = []
  const emptyIndex = words.indexOf('')

  for (let index = 0; index < words.length; index++) {
    const word = words[index]

    if (word === '') {
      if (index === emptyIndex) {
        const missing = 8 - (words.length - 1)

        for (let fill = 0; fill < missing; fill++) {
          result.push(0)
        }
      }

      continue
    }

    const parsed = Number.parseInt(word ?? '', 16)

    if (!Number.isNaN(parsed)) {
      result.push(parsed)
    }
  }

  return result
}

function extractPageTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)

  if (!match) {
    return null
  }

  return match[1]
    ?.replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) ?? null
}
