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
