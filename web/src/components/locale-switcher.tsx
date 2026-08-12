import Link from 'next/link'
import type { AppLocale } from '@/i18n/routing'

const localeLabels: Record<AppLocale, string> = {
  'pt-BR': 'PT',
  'en-US': 'EN',
  'es-ES': 'ES',
}

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--muted)]">
      {Object.entries(localeLabels).map(([value, label]) => (
        <Link
          key={value}
          href={`/${value}`}
          className={`rounded-[var(--radius-sm)] px-2 py-1 transition-colors hover:text-[var(--foreground)] ${
            value === locale
              ? 'bg-[var(--surface-raised)] text-[var(--foreground)]'
              : ''
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
