import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations({ locale: 'pt-BR' })

  return (
    <main className="page-shell grid min-h-screen place-items-center py-16">
      <div className="w-full max-w-3xl border-y border-(--border) py-12">
        <div className="eyebrow text-(--signal)">{t('notFound.eyebrow')}</div>
        <h1 className="mt-5 text-6xl font-medium tracking-[-0.07em] md:text-8xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-6 max-w-xl text-(--muted)">{t('notFound.body')}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-sm bg-(--signal) px-4 py-2.5 text-sm font-semibold text-black"
        >
          {t('notFound.back')}
        </Link>
      </div>
    </main>
  )
}
