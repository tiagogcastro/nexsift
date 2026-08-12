import Link from 'next/link'
import { LogoMark } from './logo-mark'

export function Brand({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="group flex items-center gap-3"
      aria-label="NexSift"
    >
      <LogoMark />
      <span className="text-[0.95rem] font-semibold tracking-[-0.03em]">NexSift</span>
    </Link>
  )
}
