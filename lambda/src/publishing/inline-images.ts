import { putObject } from '../storage/s3'
import type { RequestContext } from '../runtime/observability'
import { downloadImage, ImageRejectedError } from './fetch-image'

// Markdown image reference: ![alt](url). URLs with parentheses are rare in
// editorial content, so a pragmatic pattern is enough here.
const inlineImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g

export interface InlineImagesResult {
  content: string
  objectKeys: string[]
}

// Downloads every image referenced in the markdown content, stores a snapshot
// in the content bucket and rewrites the content to point at the local copy.
// The same URL used twice reuses one stored copy.
export async function resolveInlineImages(
  content: string,
  slug: string,
  requestContext?: RequestContext,
): Promise<InlineImagesResult> {
  const matches = [...content.matchAll(inlineImagePattern)]

  if (matches.length === 0) {
    return { content, objectKeys: [] }
  }

  const uniqueUrls = [
    ...new Set(matches.map((match) => match[2] ?? '').filter(Boolean)),
  ]
  const keysByUrl = new Map<string, string>()
  const objectKeys: string[] = []

  for (const url of uniqueUrls) {
    let downloaded

    try {
        downloaded = await downloadImage(url, { requestContext })
    } catch (error) {
      if (error instanceof ImageRejectedError) {
        throw new ImageRejectedError(`${error.reason} (url: ${url})`)
      }

      throw error
    }

    const objectKey = `public/images/${slug}-${objectKeys.length}${downloaded.extension}`
    await putObject(objectKey, downloaded.buffer, downloaded.contentType)
    keysByUrl.set(url, objectKey)
    objectKeys.push(objectKey)
  }

  const resolvedContent = content.replace(
    inlineImagePattern,
    (fullMatch, alt: string, url: string) => {
      const objectKey = keysByUrl.get(url)

      if (!objectKey) {
        return fullMatch
      }

      return `![${alt}](${assetPath(objectKey)})`
    },
  )

  return { content: resolvedContent, objectKeys }
}

export function assetPath(objectKey: string) {
  return `/s3/${objectKey}`
}
