import { postSchema, type Post, type PostDraft } from '@nexsift/schemas/post'
import { calculateReadingTime } from './reading-time'
import { buildSignalSlug } from './signal-slug'

export function normalizePost(
  draft: PostDraft,
  existing: Post | null,
  now = new Date(),
) {
  const primaryTopic = draft.topics[0]

  if (!primaryTopic) {
    throw new Error('A post needs at least one topic')
  }

  const slug = buildSignalSlug(primaryTopic, draft.title, draft.signalDate)
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
