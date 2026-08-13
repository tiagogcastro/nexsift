import { z } from 'zod'

export const sourceStatusSchema = z.enum([
  'healthy',
  'redirected',
  'temporarily_unavailable',
  'broken',
  'replaced',
  'blocked',
])

export const editorialStatusSchema = z.enum(['verified', 'unverified', 'unknown'])

export const sourceReplacementSchema = z.object({
  oldUrl: z.url(),
  newUrl: z.url(),
  replacedAt: z.iso.datetime(),
  reason: z.string().min(1),
})

// Zod 4 forbids .extend() on object schemas that carry refinements, so the
// refinement attaches to a plain base schema and the stored schema extends
// the base.
const postSourceBaseSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  publishedAt: z.iso.datetime().optional(),
  editorialStatus: editorialStatusSchema.optional(),
  editoriallyVerifiedAt: z.iso.datetime().optional(),
})

// Draft sources carry the editor's assertion that the page was read and that
// the content sustains the signal. The backend never derives this from HTTP
// status; it only records what the editorial flow asserted. The timestamp is
// mandatory on the assertion so it stays auditable.
export const postSourceSchema = postSourceBaseSchema.superRefine(
  (source, ctx) => {
    if (source.editorialStatus === 'verified' && !source.editoriallyVerifiedAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'editoriallyVerifiedAt is required when editorialStatus is verified',
        path: ['editoriallyVerifiedAt'],
      })
    }
  },
)

// Verification fields are attached by the backend when the source URL is
// actually fetched and inspected. The editor never sends them; a source only
// enters a stored post with these fields after a successful mechanical
// check. Fields are optional so older posts without a verification record
// still parse; absence means "not yet verified mechanically".
export const verifiedPostSourceSchema = postSourceBaseSchema.extend({
  firstVerifiedAt: z.iso.datetime().optional(),
  verifiedAtPublication: z.boolean().optional(),
  lastCheckedAt: z.iso.datetime().optional(),
  lastSuccessfulAt: z.iso.datetime().optional(),
  httpStatus: z.number().int().min(100).max(599).optional(),
  finalUrl: z.url().optional(),
  sourceStatus: sourceStatusSchema.optional(),
  replacements: z.array(sourceReplacementSchema).optional(),
})

export type PostSource = z.infer<typeof postSourceSchema>
export type VerifiedPostSource = z.infer<typeof verifiedPostSourceSchema>
export type SourceStatus = z.infer<typeof sourceStatusSchema>
export type EditorialStatus = z.infer<typeof editorialStatusSchema>
export type SourceReplacement = z.infer<typeof sourceReplacementSchema>
