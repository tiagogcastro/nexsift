import Link from 'next/link'

export function Brand({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="group flex items-center gap-3"
      aria-label="NexSift"
    >
      <span className="relative grid size-7 place-items-center border border-[var(--border-strong)] bg-[var(--surface)] font-mono text-[10px] font-bold tracking-[-0.08em] text-[var(--signal)] transition-colors group-hover:border-[var(--signal)]">
        N/
      </span>
      <span className="text-[0.95rem] font-semibold tracking-[-0.03em]">NexSift</span>
    </Link>
  )
}
