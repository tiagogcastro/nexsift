import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SignalLedger } from '@/features/blog/signal-ledger'
import { listPosts } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Sinais e análises técnicas do NexSift em português.',
  alternates: {
    canonical: '/pt-BR/blog',
  },
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (locale !== 'pt-BR') {
    redirect('/pt-BR/blog')
  }

  const t = await getTranslations()
  const posts = await listPosts()

  return (
    <>
      <Header
        locale="pt-BR"
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <div className="eyebrow">{t('blog.eyebrow')}</div>
            <h1 className="mt-5 max-w-md text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('blog.title')}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              {t('blog.description')}
            </p>
            <div className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">
              <span className="signal-dot" />
              {posts.length} sinais publicados
            </div>
          </div>
          <SignalLedger posts={posts} />
        </div>
      </main>
      <Footer
        locale="pt-BR"
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
