'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PostSummary } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { topicIcons } from '@/lib/topic-icons'
import { topicOrder } from '@/lib/topics'
import { LedgerRow } from './ledger-row'

interface TopicMeta {
  label: string
}

interface ConsoleLabels {
  searchPlaceholder: string
  allTopics: string
  countLabelOne: string
  countLabelOther: string
  loadMore: string
  empty: string
  signalFallback: string
  relevanceLabel: string
  newLabel: string
  sourcesLabel: string
}

interface LedgerConsoleProps {
  posts: PostSummary[]
  fixedTopic: Topic | undefined
  labels: ConsoleLabels
  topicMeta: Record<Topic, TopicMeta>
  initialTopic: Topic | undefined
  initialQuery: string | undefined
  pageSize?: number
}

export function LedgerConsole({
  posts,
  fixedTopic,
  labels,
  topicMeta,
  initialTopic,
  initialQuery,
  pageSize = 20,
}: LedgerConsoleProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery ?? '')
  const [topic, setTopic] = useState<Topic | null>(fixedTopic ?? initialTopic ?? null)
  const [visibleCount, setVisibleCount] = useState(pageSize)

  function resetPage() {
    setVisibleCount(pageSize)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams()

      if (query) {
        params.set('q', query)
      }

      if (!fixedTopic && topic) {
        params.set('topic', topic)
      }

      const basePath = fixedTopic ? `/topics/${fixedTopic}` : '/blog'
      const queryString = params.toString()

      router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
        scroll: false,
      })
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [query, topic, router, fixedTopic])

  const counts = useMemo(() => {
    const result = {} as Record<Topic, number>

    for (const post of posts) {
      for (const postTopic of post.topics) {
        result[postTopic] = (result[postTopic] ?? 0) + 1
      }
    }

    return result
  }, [posts])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts
      .filter((post) => {
        if (topic && post.topics[0] !== topic) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const haystack = `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase()

        return haystack.includes(normalizedQuery)
      })
      .sort(
        (first, second) =>
          new Date(second.publishedAt).getTime() -
          new Date(first.publishedAt).getTime(),
      )
  }, [posts, query, topic])

  const visiblePosts = filtered.slice(0, visibleCount)

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-(--border) pb-6 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            resetPage()
          }}
          placeholder={labels.searchPlaceholder}
          className="w-full border border-(--border) bg-(--surface) px-4 py-2.5 font-mono text-sm text-(--foreground) outline-none transition-colors placeholder:text-(--muted) focus:border-(--signal) md:max-w-md lg:max-w-lg"
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-(--muted)">
          {filtered.length}{' '}
          {filtered.length === 1 ? labels.countLabelOne : labels.countLabelOther}
        </span>
      </div>

      {!fixedTopic ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border) py-4">
          <button
            type="button"
            onClick={() => {
              setTopic(null)
              resetPage()
            }}
            className={`flex items-center gap-1.5 rounded-(--radius-sm) px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
              topic === null
                ? 'bg-(--signal) text-black'
                : 'text-(--muted) hover:text-(--foreground)'
            }`}
          >
            {labels.allTopics}
          </button>
          {topicOrder.map((topicKey) => {
            const TopicIcon = topicIcons[topicKey]

            return (
              <button
                key={topicKey}
                type="button"
                data-topic={topicKey}
                onClick={() => {
                  setTopic(topic === topicKey ? null : topicKey)
                  resetPage()
                }}
                className={`topic-color flex items-center gap-1.5 rounded-(--radius-sm) px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  topic === topicKey
                    ? 'bg-(--topic-color) text-black'
                    : 'text-(--muted) hover:text-(--topic-color)'
                }`}
              >
                <TopicIcon
                  size={11}
                  strokeWidth={2}
                  className={topic === topicKey ? undefined : 'text-(--topic-color)'}
                />
                {topicMeta[topicKey].label} {counts[topicKey] ?? 0}
              </button>
            )
          })}
        </div>
      ) : null}

      {visiblePosts.length > 0 ? (
        <div>
          {visiblePosts.map((post, index) => {
            const postTopic = post.topics[0]
            const topicLabel = postTopic
              ? topicMeta[postTopic].label
              : undefined

            return (
              <LedgerRow
                key={post.slug}
                post={post}
                index={index}
                topicLabel={topicLabel}
                relevanceLabel={labels.relevanceLabel}
                newLabel={labels.newLabel}
                sourcesLabel={labels.sourcesLabel}
                fallbackLabel={labels.signalFallback}
              />
            )
          })}
        </div>
      ) : (
        <div className="border-y border-(--border) py-10 text-sm text-(--muted)">
          {labels.empty}
        </div>
      )}

      {filtered.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + pageSize)}
          className="mt-8 inline-flex items-center gap-2 border border-(--signal) px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-(--signal) transition-colors hover:bg-(--signal) hover:text-black"
        >
          {labels.loadMore}
        </button>
      ) : null}
    </div>
  )
}
