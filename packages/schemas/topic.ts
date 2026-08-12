import { z } from 'zod'

export const topicSchema = z.enum([
  'ai',
  'aws-cloud',
  'development',
  'devops',
  'career',
])

export type Topic = z.infer<typeof topicSchema>
