import { z } from 'zod'

export const topicSchema = z.enum([
  'ai',
  'aws-cloud',
  'development',
  'devops',
  'career',
  'finance',
])

export type Topic = z.infer<typeof topicSchema>
