'use client'

import { useState } from 'react'
import { routing, type AppLocale } from '@/i18n/routing'
import Link from 'next/link'

const localeMeta: Record<AppLocale, { flag: string; name: string }> = {
  'pt-BR': { flag: '🇧🇷', name: 'Português' },
  'en-US': { flag: '🇺🇸', name: 'English' },
  'es-ES': { flag: '🇪🇸', name: 'Español' },
}

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  const current = localeMeta[locale]
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex list-none items-center gap-1.5 rounded-sm px-2 py-1.5 font-mono text-[11px] text-(--muted) transition-colors hover:bg-(--surface-raised) hover:text-(--foreground)"
      >
        <span>{current.flag}</span>
        <span>{current.name}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-48 border border-(--border) bg-(--surface-raised) p-1"
        >
          {Object.entries(localeMeta).map(([value, meta]) => (
            <Link
              key={value}
              href={value === routing.defaultLocale ? '/' : `/${value}`}
              className={`flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm transition-colors ${value === locale
                ? 'text-(--foreground)'
                : 'text-(--muted-strong) hover:bg-(--surface) hover:text-(--foreground)'
              }`}
            >
              <span>{meta.flag}</span>
              <span>{meta.name}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
