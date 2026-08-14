'use client'

import { useTranslations } from 'next-intl'
import { Mail } from 'lucide-react'
import { useLeadModal } from './lead-modal-provider'

interface LeadModalTriggerProps {
  variant: 'header' | 'footer'
}

export function LeadModalTrigger({ variant }: LeadModalTriggerProps) {
  const t = useTranslations('leadModal')
  const { openLeadModal } = useLeadModal()

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={openLeadModal}
        className="hidden items-center gap-1.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted-strong) transition-colors hover:text-(--signal) md:flex"
      >
        <Mail size={13} />
        {t('triggerHeader')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openLeadModal}
      className="inline-flex items-center gap-2 rounded-(--radius-sm) border border-(--signal) px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-(--signal) transition-colors hover:bg-(--signal) hover:text-black"
    >
      <Mail size={13} />
      {t('triggerFooter')}
    </button>
  )
}