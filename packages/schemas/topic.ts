import { z } from 'zod'

export const topicSchema = z.enum([
  'ai',
  'development',
  'cloud',
  'devops',
  'security',
  'industry',
  'design',
])

export type Topic = z.infer<typeof topicSchema>
