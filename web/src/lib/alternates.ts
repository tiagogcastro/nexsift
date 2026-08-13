import { routing, type AppLocale } from '@/i18n/routing'

// Maps a localized route to its language alternates. NexSift posts are
// pt-BR only, so post pages declare x-default instead of alternates.
export function localizedAlternates(locale: AppLocale, path: string) {
  const languages: Record<string, string> = {}

  for (const other of routing.locales) {
    if (other === routing.defaultLocale) {
      languages[other] = path
    } else {
      languages[other] = `/${other}${path}`
    }
  }

  return {
    languages,
    canonical: path,
  }
}

export function postAlternates(slug: string) {
  return {
    canonical: `/blog/${slug}`,
  }
}
