import { fetchWithRetry, UpstreamRequestError } from '../http/fetch-with-retry'
import type { RequestContext } from '../runtime/observability'
import { logInfo } from '../runtime/observability'
import { assertPublicHost, parseHttpUrl } from './validate-source'

export class ImageRejectedError extends Error {
  constructor(
    public readonly reason: string,
    public readonly code:
      | 'IMAGE_REJECTED'
      | 'RATE_LIMITED'
      | 'UPSTREAM_TIMEOUT'
      | 'SOURCE_UNAVAILABLE' = 'IMAGE_REJECTED',
    public readonly retryable = false,
    public readonly status: number | null = null,
    public readonly attempts = 1,
  ) {
    super(`Cover image rejected: ${reason}`)
    this.name = 'ImageRejectedError'
  }
}

export interface DownloadedImage {
  buffer: Buffer
  contentType: string
  extension: string
  finalUrl: string
}

const defaultTimeoutMs = 10_000
const maxRedirects = 5
const maxBytes = 5 * 1024 * 1024

// Raster formats only: SVG is excluded because a stored copy served from the
// content origin could carry scripts if ever opened directly.
const contentTypeExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
])

// Fetches an image the editor referenced and keeps a snapshot in the content
// bucket. Redirects follow the same public-host rules as source validation,
// so the download cannot be pointed at private networks. Used by both the
// cover image and inline images inside the markdown content.
export async function downloadImage(
  url: string,
  options: {
    timeoutMs?: number
    requestContext?: RequestContext | undefined
  } = {},
): Promise<DownloadedImage> {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs
  const parsed = parseHttpUrl(url)
  const startedAt = Date.now()

  if (!parsed) {
    throw rejectImage('invalid url')
  }

  try {
    await assertPublicHost(parsed.hostname)
  } catch {
    throw rejectImage('non-public host')
  }

  let currentUrl = url
  let attempts = 0

  try {
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
      const { response, attempt } = await fetchWithRetry(
        currentUrl,
        {
          method: 'GET',
          headers: {
            'user-agent': `NexSift-Source-Validator/1.0 (+${process.env.SITE_URL ?? 'https://nexsift.vercel.app'})`,
            accept: 'image/avif,image/webp,image/jpeg,image/png,image/gif',
          },
          redirect: 'manual',
        },
        { timeoutMs },
      )

      attempts += attempt

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')

        if (!location) {
          throw rejectImage('redirect without location', 'IMAGE_REJECTED', false, response.status, attempts)
        }

        const nextUrl = new URL(location, currentUrl).toString()
        const nextParsed = parseHttpUrl(nextUrl)

        if (!nextParsed) {
          throw rejectImage('redirect to invalid url', 'IMAGE_REJECTED', false, response.status, attempts)
        }

        try {
          await assertPublicHost(nextParsed.hostname)
        } catch {
          throw rejectImage('redirect to non-public host', 'IMAGE_REJECTED', false, response.status, attempts)
        }

        currentUrl = nextUrl
        continue
      }

      if (response.status === 429) {
        throw rejectImage('http 429', 'RATE_LIMITED', true, response.status, attempts)
      }

      if (response.status >= 500) {
        throw rejectImage('upstream unavailable', 'SOURCE_UNAVAILABLE', true, response.status, attempts)
      }

      if (response.status < 200 || response.status >= 300) {
        throw rejectImage(`http ${response.status}`, 'IMAGE_REJECTED', false, response.status, attempts)
      }

      const finalContentType = response.headers.get('content-type')
      const declaredLength = response.headers.get('content-length')
      const numericLength = declaredLength
        ? Number.parseInt(declaredLength, 10)
        : null

      if (numericLength !== null && numericLength > maxBytes) {
        throw rejectImage('image too large', 'IMAGE_REJECTED', false, response.status, attempts)
      }

      const bytes = Buffer.from(await response.arrayBuffer())

      if (bytes.byteLength > maxBytes) {
        throw rejectImage('image too large', 'IMAGE_REJECTED', false, response.status, attempts)
      }

      const contentType = normalizeContentType(finalContentType)

      if (!contentType) {
        throw rejectImage('not an image', 'IMAGE_REJECTED', false, response.status, attempts)
      }

      const extension = contentTypeExtensions.get(contentType)

      if (!extension) {
        throw rejectImage('unsupported image type', 'IMAGE_REJECTED', false, response.status, attempts)
      }

      if (!matchesImageSignature(bytes, contentType)) {
        throw rejectImage('image bytes do not match content type', 'IMAGE_REJECTED', false, response.status, attempts)
      }

      logInfo('image_download', {
        operation: 'downloadImage',
        requestId: options.requestContext?.requestId,
        correlationId: options.requestContext?.correlationId,
        sourceUrl: url,
        finalUrl: currentUrl,
        httpStatus: response.status,
        contentType,
        attempt: attempts,
        durationMs: Date.now() - startedAt,
      })

      return {
        buffer: bytes,
        contentType,
        extension,
        finalUrl: currentUrl,
      }
    }
  } catch (error) {
    if (error instanceof ImageRejectedError) {
      logInfo('image_download', {
        operation: 'downloadImage',
        requestId: options.requestContext?.requestId,
        correlationId: options.requestContext?.correlationId,
        sourceUrl: url,
        finalUrl: currentUrl,
        httpStatus: error.status,
        errorCode: error.code,
        retryable: error.retryable,
        attempt: error.attempts,
        durationMs: Date.now() - startedAt,
      })
      throw error
    }

    if (error instanceof UpstreamRequestError) {
      const rejected = rejectImage(
        error.code === 'UPSTREAM_TIMEOUT' ? 'download timed out' : 'download failed',
        error.code,
        true,
        null,
        attempts + error.attempt,
      )

      logInfo('image_download', {
        operation: 'downloadImage',
        requestId: options.requestContext?.requestId,
        correlationId: options.requestContext?.correlationId,
        sourceUrl: url,
        finalUrl: currentUrl,
        httpStatus: null,
        errorCode: rejected.code,
        retryable: rejected.retryable,
        attempt: rejected.attempts,
        durationMs: Date.now() - startedAt,
      })

      throw rejected
    }

    throw rejectImage('download failed', 'SOURCE_UNAVAILABLE', true, null, Math.max(attempts, 1))
  }

  throw rejectImage('too many redirects')
}

function rejectImage(
  reason: string,
  code: ImageRejectedError['code'] = 'IMAGE_REJECTED',
  retryable = false,
  status: number | null = null,
  attempts = 1,
) {
  return new ImageRejectedError(reason, code, retryable, status, attempts)
}

function normalizeContentType(value: string | null) {
  if (!value) {
    return null
  }

  const mime = value.split(';')[0]?.trim().toLowerCase()

  if (!mime || !mime.startsWith('image/')) {
    return null
  }

  return mime
}

function matchesImageSignature(bytes: Buffer, contentType: string) {
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (contentType === 'image/png') {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (contentType === 'image/gif') {
    return bytes.subarray(0, 4).toString('ascii') === 'GIF8'
  }
  if (contentType === 'image/webp') {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  if (contentType === 'image/avif') {
    const brand = bytes.subarray(4, 32).toString('ascii')
    return brand.includes('ftypavif') || brand.includes('ftypavis')
  }
  return false
}
