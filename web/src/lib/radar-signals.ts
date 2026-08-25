import type { PostSummary } from '@nexsift/schemas/post'

function publishedAtOf(post: PostSummary) {
  return new Date(post.publishedAt).getTime()
}

function sortByPublishedAtDesc(first: PostSummary, second: PostSummary) {
  return publishedAtOf(second) - publishedAtOf(first)
}

// The home radar must not read as single-topic after a publishing burst
// (e.g. three development signals followed by three design ones would make
// the newest slice look like only one topic exists). Signals are picked in
// rounds across topics, most recent first inside each topic, so consecutive
// entries rarely share a topic while overall recency still wins.
export function selectRadarSignals(posts: PostSummary[], limit: number) {
  const byTopic = new Map<PostSummary['topic'], PostSummary[]>()

  for (const post of [...posts].sort(sortByPublishedAtDesc)) {
    const group = byTopic.get(post.topic)

    if (group) {
      group.push(post)
    } else {
      byTopic.set(post.topic, [post])
    }
  }

  const queues = [...byTopic.values()].sort(
    (first, second) => publishedAtOf(second[0]!) - publishedAtOf(first[0]!),
  )

  const selected: PostSummary[] = []

  for (let round = 0; selected.length < limit; round++) {
    let pickedInRound = false

    for (const queue of queues) {
      if (selected.length >= limit) {
        break
      }

      const candidate = queue[round]

      if (candidate) {
        selected.push(candidate)
        pickedInRound = true
      }
    }

    if (!pickedInRound) {
      break
    }
  }

  return selected
}
