import type { CoverImageDraft } from '@nexsift/schemas/post'
import { assertPublicHost, parseHttpUrl } from './validate-source'

export class ImageRejectedError extends Error {
  constructor(public readonly reason: string) {
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

// Fetches the cover image the editor referenced and keeps a snapshot in the
// content bucket. Redirects follow the same public-host rules as source
// validation, so the download cannot be pointed at private networks.
export async function downloadCoverImage(
  draft: CoverImageDraft,
): Promise<DownloadedImage> {
  const parsed = parseHttpUrl(draft.url)

  if (!parsed) {
    throw new ImageRejectedError('invalid url')
  }

  try {
    await assertPublicHost(parsed.hostname)
  } catch {
    throw new ImageRejectedError('non-public host')
  }

  let currentUrl = draft.url
  let finalContentType: string | null = null

  try {
    for (let attempt = 0; attempt <= maxRedirects; attempt++) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'user-agent': 'NexSift-Source-Validator/1.0 (+https://nexsift.com)',
          accept: 'image/avif,image/webp,image/jpeg,image/png,image/gif',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(defaultTimeoutMs),
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')

        if (!location) {
          throw new ImageRejectedError('redirect without location')
        }

        const nextUrl = new URL(location, currentUrl).toString()
        const nextParsed = parseHttpUrl(nextUrl)

        if (!nextParsed) {
          throw new ImageRejectedError('redirect to invalid url')
        }

        try {
          await assertPublicHost(nextParsed.hostname)
        } catch {
          throw new ImageRejectedError('redirect to non-public host')
        }

        currentUrl = nextUrl
        continue
      }

      if (response.status < 200 || response.status >= 300) {
        throw new ImageRejectedError(`http ${response.status}`)
      }

      finalContentType = response.headers.get('content-type')
      const declaredLength = response.headers.get('content-length')
      const numericLength = declaredLength
        ? Number.parseInt(declaredLength, 10)
        : null

      if (numericLength !== null && numericLength > maxBytes) {
        throw new ImageRejectedError('image too large')
      }

      const bytes = Buffer.from(await response.arrayBuffer())

      if (bytes.byteLength > maxBytes) {
        throw new ImageRejectedError('image too large')
      }

      const contentType = normalizeContentType(finalContentType)

      if (!contentType) {
        throw new ImageRejectedError('not an image')
      }

      const extension = contentTypeExtensions.get(contentType)

      if (!extension) {
        throw new ImageRejectedError('unsupported image type')
      }

      return {
        buffer: bytes,
        contentType,
        extension,
        finalUrl: currentUrl,
      }
    }
  } catch (error) {
    if (error instanceof ImageRejectedError) {
      throw error
    }

    throw new ImageRejectedError('download failed')
  }

  throw new ImageRejectedError('too many redirects')
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
