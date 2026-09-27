'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { topicIcons } from '@/lib/topic-icons'
import { topicOrder } from '@/lib/topics'
import { LedgerRow } from './ledger-row'

interface TopicMeta {
  label: string
  shortLabel: string
}

interface ConsoleLabels {
  searchPlaceholder: string
  allTopics: string
  topicFilter: string
  selectedTopics: string
  countLabelOne: string
  countLabelOther: string
  previous: string
  next: string
  pageOf: string
  empty: string
  signalFallback: string
  relevanceLabel: string
  newLabel: string
  sourcesLabel: string
  matchedTag: string
}

interface LedgerConsoleProps {
  posts: PostSummary[]
  fixedTopic: Topic | undefined
  labels: ConsoleLabels
  topicMeta: Record<Topic, TopicMeta>
  initialTopics: Topic[]
  initialQuery: string | undefined
  pageSize?: number
}

export function LedgerConsole({
  posts,
  fixedTopic,
  labels,
  topicMeta,
  initialTopics,
  initialQuery,
  pageSize = 20,
}: LedgerConsoleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const menuRef = useRef<HTMLDetailsElement>(null)
  const [query, setQuery] = useState(initialQuery ?? '')
  const [topics, setTopics] = useState<Topic[]>(fixedTopic ? [fixedTopic] : initialTopics)

  const pageParam = Number(searchParams.get('page') ?? '1')
  const requestedPage = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const selectedTopic = topics.length === 1 ? topics[0] : undefined

  useEffect(() => {
    function syncHistory() {
      const params = new URLSearchParams(window.location.search)
      setQuery(params.get('q') ?? '')
      if (!fixedTopic) {
        const values = params.getAll('topic')
        setTopics(topicOrder.filter((key) => values.includes(key)))
      }
    }
    window.addEventListener('popstate', syncHistory)
    return () => window.removeEventListener('popstate', syncHistory)
  }, [fixedTopic])

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        menuRef.current.open = false
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false
        menuRef.current.querySelector('summary')?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  function navigate(nextQuery: string, nextTopics: Topic[], nextPage: number, replace = false) {
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (!fixedTopic) nextTopics.forEach((topic) => params.append('topic', topic))
    if (nextPage > 1) params.set('page', String(nextPage))
    const basePath = fixedTopic ? `/topics/${fixedTopic}` : '/blog'
    const href = params.size ? `${basePath}?${params}` : basePath
    if (replace) router.replace(href, { scroll: false })
    else router.push(href, { scroll: false })
  }

  useEffect(() => {
    if (query === (searchParams.get('q') ?? '')) return
    const timeoutId = setTimeout(() => navigate(query, topics, 1, true), 300)
    return () => clearTimeout(timeoutId)
    // Topic changes navigate immediately in their own handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchParams, topics])

  const counts = useMemo(() => {
    const result = {} as Record<Topic, number>
    for (const post of posts) result[post.topic] = (result[post.topic] ?? 0) + 1
    return result
  }, [posts])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return posts.filter((post) => {
      if (topics.length > 0 && !topics.includes(post.topic)) return false
      if (!normalizedQuery) return true
      return `${post.title} ${post.description} ${post.tags.join(' ')}`
        .toLocaleLowerCase('pt-BR').includes(normalizedQuery)
    })
  }, [posts, query, topics])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const visiblePosts = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) =>
    Math.max(1, Math.min(page - 2, pageCount - 4)) + index,
  )

  useEffect(() => {
    if (requestedPage > pageCount || (searchParams.has('page') && requestedPage === 1)) {
      navigate(query, topics, page, true)
    }
    // Only normalize when the count or requested page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPage, pageCount])

  function selectTopics(nextTopics: Topic[]) {
    setTopics(nextTopics)
    navigate(query, nextTopics, 1)
  }

  return (
    <div>
      <div className={`flex flex-col gap-3 border-b border-(--border) sm:flex-row sm:items-center ${fixedTopic ? 'pb-4' : 'sticky top-[4.5rem] z-30 bg-(--background) py-3'}`}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
          className="min-w-0 flex-1 border border-(--border) bg-(--surface) px-4 py-2.5 font-mono text-sm text-(--foreground) outline-none transition-colors placeholder:text-(--muted) focus:border-(--signal)"
        />
        {!fixedTopic ? (
          <details ref={menuRef} className="group relative z-20 sm:w-52">
            <summary className="flex min-h-11 list-none items-center justify-between gap-3 border border-(--border) bg-(--surface) px-3 font-mono text-xs text-(--foreground) [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 truncate"><span className="text-(--muted)">{labels.topicFilter}: </span>{selectedTopic ? (selectedTopic === 'ai' ? <><span className="sm:hidden">{topicMeta.ai.shortLabel}</span><span className="hidden sm:inline">{topicMeta.ai.label}</span></> : topicMeta[selectedTopic].label) : topics.length > 1 ? `${topics.length} ${labels.selectedTopics}` : labels.allTopics}</span>
              <ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-[min(26rem,60vh)] overflow-y-auto border border-(--border-strong) bg-(--surface-raised) p-1 shadow-lg">
              <label className={`flex cursor-pointer items-center gap-2 border-b border-(--border) px-3 py-2.5 text-sm hover:bg-(--surface) ${topics.length === 0 ? 'bg-(--surface)' : ''}`}>
                <input type="checkbox" checked={topics.length === 0} onChange={() => selectTopics([])} className="peer sr-only" />
                <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-[3px] border border-(--border-strong) bg-(--surface) text-(--on-signal) peer-checked:border-(--signal) peer-checked:bg-(--signal) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--signal)">
                  {topics.length === 0 ? <Check size={12} strokeWidth={3} /> : null}
                </span>
                <span className="flex-1">{labels.allTopics}</span><span className="font-mono text-xs text-(--muted)">{posts.length}</span>
              </label>
              {topicOrder.map((key) => {
                const TopicIcon = topicIcons[key]
                const selected = topics.includes(key)
                return <label key={key} data-topic={key} className={`topic-color flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm hover:bg-(--surface) ${selected ? 'bg-(--surface)' : ''}`}>
                  <input type="checkbox" checked={selected} onChange={() => selectTopics(selected ? topics.filter((topic) => topic !== key) : topicOrder.filter((topic) => topic === key || topics.includes(topic)))} className="peer sr-only" />
                  <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-[3px] border border-(--border-strong) bg-(--surface) text-(--on-signal) peer-checked:border-(--topic-color) peer-checked:bg-(--topic-color) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--topic-color)">
                    {selected ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  <TopicIcon size={15} className="shrink-0 text-(--topic-color)" />
                  <span className="min-w-0 flex-1 truncate">{topicMeta[key].label}</span>
                  <span className="font-mono text-xs text-(--muted)">{counts[key] ?? 0}</span>
                </label>
              })}
            </div>
          </details>
        ) : null}
      </div>
      <div className="py-3 font-mono text-[11px] text-(--muted)" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? labels.countLabelOne : labels.countLabelOther}
      </div>
      {visiblePosts.length > 0 ? (
        <div className="ledger-console-list">
          {visiblePosts.map((post, index) => (
            <LedgerRow key={post.slug} post={post} index={(page - 1) * pageSize + index} topicLabel={topicMeta[post.topic]?.label}
              relevanceLabel={labels.relevanceLabel} newLabel={labels.newLabel} sourcesLabel={labels.sourcesLabel}
              fallbackLabel={labels.signalFallback} query={query.trim()} matchedTagLabel={labels.matchedTag} />
          ))}
        </div>
      ) : <div className="border-y border-(--border) py-10 text-sm text-(--muted)">{labels.empty}</div>}
      {pageCount > 1 ? (
        <nav aria-label={labels.pageOf} className="mt-7 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <button type="button" disabled={page === 1} onClick={() => navigate(query, topics, page - 1)} className="flex items-center gap-1 text-(--muted-strong) disabled:opacity-40"><ChevronLeft size={15} />{labels.previous}</button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((number) => <button type="button" key={number} aria-label={`${labels.pageOf} ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => navigate(query, topics, number)} className={`grid size-9 place-items-center ${number === page ? 'bg-(--signal) text-(--on-signal)' : 'text-(--muted-strong) hover:bg-(--surface-raised)'}`}>{number}</button>)}
          </div>
          <button type="button" disabled={page === pageCount} onClick={() => navigate(query, topics, page + 1)} className="flex items-center gap-1 text-(--muted-strong) disabled:opacity-40">{labels.next}<ChevronRight size={15} /></button>
        </nav>
      ) : null}
    </div>
  )
}
