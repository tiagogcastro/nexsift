import { z } from 'zod'

export const depthSchema = z.enum(['practical', 'deep'])

export type Depth = z.infer<typeof depthSchema>
