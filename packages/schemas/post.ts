import { z } from 'zod'
import { postSourceSchema } from './source'
import { topicSchema } from './topic'

export const contentTypeSchema = z.enum(['daily-briefing', 'article'])

export const postDraftSchema = z.object({
  type: contentTypeSchema.default('article'),
  slug: z.string().min(3).optional(),
  title: z.string().min(8).max(140),
  description: z.string().min(30).max(260),
  content: z.string().min(100),
  whyItMatters: z.string().min(30).max(800),
  topics: z.array(topicSchema).min(1).max(3),
  tags: z.array(z.string().min(1)).max(10).default([]),
  sources: z.array(postSourceSchema).min(1),
  relevanceScore: z.number().min(0).max(10),
  featured: z.boolean().optional(),
})

export const postSchema = postDraftSchema.extend({
  id: z.string().min(1),
  slug: z.string().min(3),
  publishedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().optional(),
  readingTime: z.number().int().positive(),
  locale: z.literal('pt-BR'),
})

export const postSummarySchema = postSchema.pick({
  id: true,
  type: true,
  slug: true,
  title: true,
  description: true,
  topics: true,
  tags: true,
  publishedAt: true,
  readingTime: true,
  relevanceScore: true,
  locale: true,
  featured: true,
})

export const postIndexSchema = z.array(postSummarySchema)

export type ContentType = z.infer<typeof contentTypeSchema>
export type PostDraft = z.infer<typeof postDraftSchema>
export type Post = z.infer<typeof postSchema>
export type PostSummary = z.infer<typeof postSummarySchema>
