import { z } from 'zod'
import { depthSchema } from './depth'
import { postSourceSchema, verifiedPostSourceSchema } from './source'
import { signalTypeSchema } from './signal-type'
import { topicSchema } from './topic'

export const signalSlugRegex = new RegExp(
  `^(${topicSchema.options.join('|')})-[a-z0-9]+(-[a-z0-9]+)*-\\d{4}-\\d{2}-\\d{2}$`,
)

// Zod 4 forbids .extend() and .pick() on object schemas that carry
// refinements, so the refinements attach to plain base schemas.
export const coverImageDraftSchema = z.object({
  url: z.url(),
  alt: z.string().min(1).max(200),
  caption: z.string().max(300).optional(),
})

// The stored cover image is a snapshot: the backend downloads the image at
// publication time and keeps a copy in the content bucket, so the site never
// hotlinks the source host.
export const coverImageSchema = z.object({
  objectKey: z.string().min(1),
  sourceUrl: z.url(),
  contentType: z.string().min(1),
  alt: z.string().min(1).max(200),
  caption: z.string().max(300).optional(),
  checkedAt: z.iso.datetime(),
})

const draftFields = {
  slug: z.string().min(3).optional(),
  title: z.string().min(8).max(140),
  description: z.string().min(30).max(260),
  content: z.string().min(100),
  whyItMatters: z.string().min(30).max(800),
  whatToWatch: z.string().min(30).max(500),
  topic: topicSchema,
  relatedTopics: z.array(topicSchema).max(2).default([]),
  signalDate: z.iso.date(),
  publishedAt: z.iso.datetime({ offset: true }).refine(
    (value) => new Date(value).getTime() <= Date.now(),
    'publishedAt must not be in the future',
  ).optional(),
  signalType: signalTypeSchema,
  depth: depthSchema,
  tags: z.array(z.string().min(1)).max(10).default([]),
  sources: z.array(postSourceSchema).min(1),
  relevanceScore: z.number().min(0).max(10),
  confidenceScore: z.number().min(0).max(10),
  featured: z.boolean().optional(),
  coverImage: coverImageDraftSchema.optional(),
}

const draftBaseSchema = z.object(draftFields)
const updateBaseSchema = draftBaseSchema.partial().extend({
  slug: z.string().regex(signalSlugRegex),
})

export const postIdentitySchema = z.object({
  title: draftFields.title,
  topic: topicSchema,
  signalDate: draftFields.signalDate,
})

export const completePostDraftSchema = draftBaseSchema
  .refine(
    (draft) => !draft.relatedTopics.includes(draft.topic),
    {
      message: 'relatedTopics must not contain the primary topic',
      path: ['relatedTopics'],
    },
  )
  .refine(
    (draft) =>
      draft.slug === undefined ||
      (draft.slug.startsWith(`${draft.topic}-`) &&
        draft.slug.endsWith(`-${draft.signalDate}`)),
    {
      message: 'slug must start with {topic}- and end with -{signalDate}',
      path: ['slug'],
    },
  )

export const postUpdateSchema = updateBaseSchema.refine(
  (draft) =>
    !draft.topic ||
    !draft.relatedTopics ||
    !draft.relatedTopics.includes(draft.topic),
  {
    message: 'relatedTopics must not contain the primary topic',
    path: ['relatedTopics'],
  },
)

export const postDraftSchema = z.union([
  completePostDraftSchema,
  postUpdateSchema,
])

// whatToWatch is required on publish (draft gate) but optional on stored
// posts so legacy records without the field can be read, migrated and
// re-published before the field is filled.
const postFieldsSchema = draftBaseSchema
  .omit({ whatToWatch: true, publishedAt: true })
  .extend({
    id: z.string().min(1),
    slug: z.string().regex(signalSlugRegex),
    publishedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime().optional(),
    readingTime: z.number().int().positive(),
    locale: z.literal('pt-BR'),
    whatToWatch: z.string().min(30).max(500).optional(),
    sources: z.array(verifiedPostSourceSchema).min(1),
    coverImage: coverImageSchema.optional(),
  })

export const postSchema = postFieldsSchema.refine(
  (post) =>
    post.slug.startsWith(`${post.topic}-`) &&
    post.slug.endsWith(`-${post.signalDate}`),
  {
    message: 'slug must start with {topic}- and end with -{signalDate}',
    path: ['slug'],
  },
)

export const postSummarySchema = postFieldsSchema.pick({
  id: true,
  slug: true,
  title: true,
  description: true,
  topic: true,
  relatedTopics: true,
  tags: true,
  signalDate: true,
  publishedAt: true,
  updatedAt: true,
  readingTime: true,
  relevanceScore: true,
  confidenceScore: true,
  signalType: true,
  depth: true,
  featured: true,
  locale: true,
  sources: true,
  coverImage: true,
})

export const postListItemSchema = postFieldsSchema.pick({
  slug: true,
  title: true,
  description: true,
  topic: true,
  relatedTopics: true,
  signalDate: true,
  signalType: true,
  depth: true,
  publishedAt: true,
  updatedAt: true,
  relevanceScore: true,
  confidenceScore: true,
})

export const postIndexSchema = z.array(postSummarySchema)

export type PostDraft = z.infer<typeof postDraftSchema>
export type CompletePostDraft = z.infer<typeof completePostDraftSchema>
export type PostUpdate = z.infer<typeof postUpdateSchema>
export type Post = z.infer<typeof postSchema>
export type PostSummary = z.infer<typeof postSummarySchema>
export type PostIdentity = z.infer<typeof postIdentitySchema>
export type PostListItem = z.infer<typeof postListItemSchema>
export type CoverImageDraft = z.infer<typeof coverImageDraftSchema>
export type CoverImage = z.infer<typeof coverImageSchema>
