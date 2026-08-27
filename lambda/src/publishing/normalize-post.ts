import {
  postSchema,
  type CoverImage,
  type CompletePostDraft,
  type Post,
} from '@nexsift/schemas/post'
import { calculateReadingTime } from './reading-time'
import { buildSignalSlug } from './signal-slug'

export function normalizePost(
  draft: Omit<CompletePostDraft, 'coverImage'> & { coverImage: CoverImage | undefined },
  existing: Post | null,
  now = new Date(),
) {
  const slug = existing?.slug ?? buildSignalSlug(draft.topic, draft.title, draft.signalDate)
  const timestamp = now.toISOString()
  const post = {
    ...draft,
    id: existing?.id ?? `post_${slug}`,
    slug,
    tags: normalizeTags(draft.tags),
    publishedAt: draft.publishedAt
      ? new Date(draft.publishedAt).toISOString()
      : existing?.publishedAt ?? timestamp,
    updatedAt: existing ? timestamp : undefined,
    readingTime: calculateReadingTime(draft.content),
    locale: 'pt-BR' as const,
  }

  return postSchema.parse(post)
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}
