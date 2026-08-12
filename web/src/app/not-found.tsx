import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-screen place-items-center py-16">
      <div className="w-full max-w-3xl border-y border-[var(--border)] py-12">
        <div className="eyebrow text-[var(--signal)]">404 / NO SIGNAL</div>
        <h1 className="mt-5 text-6xl font-medium tracking-[-0.07em] md:text-8xl">
          Frequência não encontrada.
        </h1>
        <p className="mt-6 max-w-xl text-[var(--muted)]">
          Este endereço não aponta para um sinal publicado pelo NexSift.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-[var(--radius-sm)] bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-[#090b0d]"
        >
          Voltar ao radar
        </Link>
      </div>
    </main>
  )
}
