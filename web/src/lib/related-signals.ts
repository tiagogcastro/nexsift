import type { Post, PostSummary } from '@nexsift/schemas/post'

const excludedTags = new Set([
  'removed',
  'duplicate',
  'duplicated',
  'obsolete',
  'closed',
  'encerrado',
  'encerrada',
])

export function selectRelatedSignals(
  current: Post,
  posts: PostSummary[],
  now = new Date(),
  limit = 6,
) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const candidates = posts
    .filter(
      (candidate) =>
        candidate.slug !== current.slug &&
        !candidate.tags.some((tag) => excludedTags.has(tag.toLowerCase())),
    )
    .map((candidate) => ({
      candidate,
      score: similarityScore(current, candidate),
      publishedAt: new Date(candidate.publishedAt).getTime(),
      tie: stableHash(`${current.slug}:${day}:${candidate.slug}`),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.publishedAt - first.publishedAt ||
        first.tie - second.tie,
    )

  const direct = candidates.find(({ candidate }) =>
    candidate.topic === current.topic ||
    current.relatedTopics.includes(candidate.topic) ||
    candidate.relatedTopics.includes(current.topic),
  )
  const ordered = direct
    ? [direct, ...candidates.filter((entry) => entry !== direct)]
    : candidates
  const selected: PostSummary[] = []
  const topics = new Map<PostSummary['topic'], number>()
  const vendors = new Set<string>()

  for (const enforceVendorDiversity of [true, false]) {
    for (const { candidate } of ordered) {
      if (selected.length >= Math.min(6, Math.max(4, limit))) break
      if (selected.some((item) => item.slug === candidate.slug)) continue
      if ((topics.get(candidate.topic) ?? 0) >= 2) continue
      if (enforceVendorDiversity && vendors.has(vendorOf(candidate))) continue
      selected.push(candidate)
      topics.set(candidate.topic, (topics.get(candidate.topic) ?? 0) + 1)
      vendors.add(vendorOf(candidate))
    }
  }

  if (selected.length < 4) {
    for (const { candidate } of ordered) {
      if (selected.length >= 4) break
      if (!selected.some((item) => item.slug === candidate.slug)) {
        selected.push(candidate)
      }
    }
  }

  return selected
}

function similarityScore(current: Post, candidate: PostSummary) {
  const currentTags = new Set(current.tags)
  const tagOverlap = candidate.tags.filter((tag) => currentTags.has(tag)).length

  return (
    (candidate.topic === current.topic ? 4 : 0) +
    (current.relatedTopics.includes(candidate.topic) ? 2 : 0) +
    (candidate.relatedTopics.includes(current.topic) ? 2 : 0) +
    tagOverlap * 2 +
    (candidate.signalType === current.signalType ? 1 : 0)
  )
}

function vendorOf(candidate: PostSummary) {
  return candidate.sources[0]?.publisher.trim().toLowerCase() || candidate.tags[0] || candidate.slug
}

function stableHash(value: string) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
