'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { captureEvent } from '@/analytics/events'
import { useLeadModal } from './lead-modal-provider'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const inputClass =
  'w-full border border-(--border) bg-(--surface) px-4 py-2.5 font-mono text-sm text-(--foreground) outline-none transition-colors placeholder:text-(--muted) focus:border-(--signal)'

export function LeadModal() {
  const t = useTranslations('leadModal')
  const locale = useLocale()
  const { open, closeLeadModal } = useLeadModal()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    nameInputRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLeadModal()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeLeadModal])

  if (!open) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (honeypot) {
      setStatus('success')
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedFeedback = feedback.trim()

    if (!trimmedName || !EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus('error')
      return
    }

    setStatus('submitting')

    const properties: Record<string, string | number | boolean> = {
      name: trimmedName,
      email: trimmedEmail,
      page: window.location.pathname,
      locale,
    }

    if (trimmedFeedback) {
      properties.feedback = trimmedFeedback
    }

    captureEvent('lead_captured', properties)

    setStatus('success')
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={closeLeadModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        className="relative w-full max-w-md border border-(--border-strong) bg-(--surface-raised) shadow-[0_0_80px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
          <span className="eyebrow flex items-center gap-2 text-(--signal)">
            <span className="signal-dot" />
            {t('eyebrow')}
          </span>
          <button
            type="button"
            onClick={closeLeadModal}
            aria-label={t('close')}
            className="grid size-9 place-items-center rounded-sm text-(--muted-strong) transition-colors hover:bg-(--surface) hover:text-(--foreground)"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-5 py-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-(--signal) text-black">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <div>
                <h2
                  id="lead-modal-title"
                  className="text-lg font-medium tracking-[-0.03em]"
                >
                  {t('successTitle')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-(--muted-strong)">
                  {t('successBody')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeLeadModal}
              className="mt-6 h-10 w-full rounded-sm bg-(--signal) px-4 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
            >
              {t('successAction')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-6">
            <div>
              <h2
                id="lead-modal-title"
                className="text-xl font-medium tracking-[-0.03em]"
              >
                {t('title')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-(--muted)">
                {t('description')}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lead-name"
                className="block font-mono text-[11px] uppercase tracking-[0.1em] text-(--muted)"
              >
                {t('nameLabel')}
              </label>
              <input
                id="lead-name"
                ref={nameInputRef}
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('namePlaceholder')}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lead-email"
                className="block font-mono text-[11px] uppercase tracking-[0.1em] text-(--muted)"
              >
                {t('emailLabel')}
              </label>
              <input
                id="lead-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('emailPlaceholder')}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lead-feedback"
                className="block font-mono text-[11px] uppercase tracking-[0.1em] text-(--muted)"
              >
                {t('feedbackLabel')}
              </label>
              <textarea
                id="lead-feedback"
                name="feedback"
                rows={3}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder={t('feedbackPlaceholder')}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input
                id="lead-company"
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>

            {status === 'error' ? (
              <p role="alert" className="text-sm text-(--danger)">
                {t('error')}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="h-11 w-full rounded-sm bg-(--signal) px-4 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('submit')}
            </button>

            <p className="font-mono text-xs leading-relaxed text-(--muted)">
              {t('privacyNote')}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}