import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['pt-BR', 'en-US', 'es-ES'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
  localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]
