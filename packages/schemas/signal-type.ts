import { z } from 'zod'

export const signalTypeSchema = z.enum([
  'release',
  'risk',
  'shift',
  'research',
  'industry',
  'opportunity',
])

export type SignalType = z.infer<typeof signalTypeSchema>
