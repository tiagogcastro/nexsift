import { z } from 'zod'

export const sourceStatusSchema = z.enum([
  'healthy',
  'redirected',
  'temporarily_unavailable',
  'broken',
  'replaced',
])

export const postSourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  publishedAt: z.iso.datetime().optional(),
})

// Verification fields are attached by the backend when the source URL is
// actually fetched and inspected. The editor never sends them; a source only
// enters a stored post with these fields after a successful mechanical
// check. Fields are optional so older posts without a verification record
// still parse; absence means "not yet verified mechanically".
export const verifiedPostSourceSchema = postSourceSchema.extend({
  lastCheckedAt: z.iso.datetime().optional(),
  lastSuccessfulAt: z.iso.datetime().optional(),
  httpStatus: z.number().int().min(100).max(599).optional(),
  finalUrl: z.url().optional(),
  sourceStatus: sourceStatusSchema.optional(),
})

export type PostSource = z.infer<typeof postSourceSchema>
export type VerifiedPostSource = z.infer<typeof verifiedPostSourceSchema>
export type SourceStatus = z.infer<typeof sourceStatusSchema>
