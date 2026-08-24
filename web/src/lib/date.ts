const EDITORIAL_TIME_ZONE = 'America/Sao_Paulo'

export function formatDate(value: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: EDITORIAL_TIME_ZONE,
  }).format(new Date(value))
}

export function formatCompactDate(value: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: EDITORIAL_TIME_ZONE,
  }).format(new Date(value))
}
