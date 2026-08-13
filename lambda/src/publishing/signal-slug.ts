import type { Topic } from '@nexsift/schemas/topic'
import { slugifyTitle } from './slugify'

export function buildSignalSlug(
  primaryTopic: Topic,
  title: string,
  signalDate: string,
) {
  const titleSlug = slugifyTitle(title)

  if (!titleSlug) {
    throw new Error('Unable to create a valid slug')
  }

  return `${primaryTopic}-${titleSlug}-${signalDate}`
}
