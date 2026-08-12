import {
  postSchema,
  type Post,
  type PostDraft,
} from '@nexsift/contracts'
import { calculateReadingTime } from './reading-time'
import { createSlug } from './slug'

export function normalizePost(
  draft: PostDraft,
  existing: Post | null,
  now = new Date(),
) {
  const slug = draft.slug ? createSlug(draft.slug) : createSlug(draft.title)

  if (!slug) {
    throw new Error('Unable to create a valid slug')
  }

  const timestamp = now.toISOString()
  const post = {
    ...draft,
    id: existing?.id ?? `post_${slug}`,
    slug,
    tags: normalizeTags(draft.tags),
    publishedAt: existing?.publishedAt ?? timestamp,
    updatedAt: existing ? timestamp : undefined,
    readingTime: calculateReadingTime(draft.content),
    locale: 'pt-BR' as const,
  }

  return postSchema.parse(post)
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}
