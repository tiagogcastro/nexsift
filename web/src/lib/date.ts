import type { PostSummary } from '@nexsift/schemas/post'

export function formatDate(value: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatCompactDate(value: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

export function postLatestUpdate(
  post: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
): string {
  return post.updatedAt ?? post.publishedAt
}

export function compareByLatestUpdate(
  first: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
  second: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
): number {
  return (
    new Date(postLatestUpdate(second)).getTime() -
    new Date(postLatestUpdate(first)).getTime()
  )
}
