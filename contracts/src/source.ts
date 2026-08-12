import { z } from 'zod'

export const postSourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  publishedAt: z.iso.datetime().optional(),
})

export type PostSource = z.infer<typeof postSourceSchema>
