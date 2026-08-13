import type { PostSummary } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'

export interface HomeSelectionOptions {
  limit?: number
  maxPerTopic?: number
  seed?: string
}

const defaultLimit = 5
const defaultMaxPerTopic = 2

export function dailySeed(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function selectHomeSignals(
  posts: PostSummary[],
  options: HomeSelectionOptions = {},
) {
  const limit = options.limit ?? defaultLimit
  const maxPerTopic = options.maxPerTopic ?? defaultMaxPerTopic
  const seed = options.seed ?? dailySeed(new Date())
  const random = mulberry32(hashString(seed))

  const ranked = [...posts].sort(compareByRelevance)

  const selected: PostSummary[] = []
  const taken = new Set<string>()
  const topicCounts = new Map<Topic, number>()

  while (selected.length < limit) {
    const candidates = ranked.filter((post) => {
      const primary = post.topics[0]

      return (
        primary !== undefined &&
        !taken.has(post.slug) &&
        (topicCounts.get(primary) ?? 0) < maxPerTopic
      )
    })

    if (candidates.length === 0) {
      break
    }

    candidates.sort((first, second) => {
      const firstTopic = first.topics[0] as Topic
      const secondTopic = second.topics[0] as Topic
      const countDiff =
        (topicCounts.get(firstTopic) ?? 0) - (topicCounts.get(secondTopic) ?? 0)

      if (countDiff !== 0) {
        return countDiff
      }

      const relevanceDiff = second.relevanceScore - first.relevanceScore

      if (relevanceDiff !== 0) {
        return relevanceDiff
      }

      const freshnessDiff =
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()

      if (freshnessDiff !== 0) {
        return freshnessDiff
      }

      return random() - 0.5
    })

    const pick = candidates[0]

    if (!pick || !pick.topics[0]) {
      break
    }

    selected.push(pick)
    taken.add(pick.slug)

    for (const topic of pick.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
    }
  }

  return selected
}

function compareByRelevance(first: PostSummary, second: PostSummary) {
  const relevanceDiff = second.relevanceScore - first.relevanceScore

  if (relevanceDiff !== 0) {
    return relevanceDiff
  }

  return (
    new Date(second.publishedAt).getTime() -
    new Date(first.publishedAt).getTime()
  )
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed

  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
