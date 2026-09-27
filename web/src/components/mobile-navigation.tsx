'use client'

import { House, Layers, Radar, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/routing'

export function MobileNavigation({ locale }: { locale: AppLocale }) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const prefix = locale === 'pt-BR' ? '' : `/${locale}`
  const items = [
    { label: t('home'), href: prefix || '/', icon: House, active: pathname === (prefix || '/') },
    { label: t('blog'), href: '/blog', icon: Radar, active: pathname.startsWith('/blog') },
    { label: t('topics'), href: `${prefix}/topics`, icon: Layers, active: pathname.startsWith(`${prefix}/topics`) },
    { label: t('about'), href: `/${locale}/about`, icon: UserRound, active: pathname.startsWith(`/${locale}/about`) },
  ]

  return <nav aria-label={t('mobileNavigation')} className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-(--header-bg) pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
    <div className="grid h-16 grid-cols-4">
      {items.map(({ label, href, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-1 font-mono text-[10px] ${active ? 'text-(--signal)' : 'text-(--muted-strong)'}`}>
        <Icon size={19} strokeWidth={active ? 2.2 : 1.8} /> {label}
      </Link>)}
    </div>
  </nav>
}
