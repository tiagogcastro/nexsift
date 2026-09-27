'use client'

import { Check, Copy, Mail, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ShareLabels {
  share: string
  copy: string
  copied: string
  copyFailed: string
  email: string
  intro: string
  linkedinCopy: string
  linkedinText: string
  whatsappText: string
  emailSubject: string
  emailBody: string
}

export function SharePost({ url, title, labels }: { url: string; title: string; labels: ShareLabels }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'linkedin' | 'failed'>('idle')
  const menuRef = useRef<HTMLDetailsElement>(null)
  const message = `${labels.intro} ${title}`
  const formatted = (intro: string) => `${intro}\n\n${title}\n${url}`
  const localUrl = ['localhost', '127.0.0.1'].includes(new URL(url).hostname)

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = setTimeout(() => setCopyState('idle'), 2500)
    return () => clearTimeout(timeout)
  }, [copyState])

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false
        menuRef.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])

  async function copyLink(forLinkedIn = false) {
    try {
      await navigator.clipboard.writeText(forLinkedIn ? formatted(labels.linkedinText) : url)
      setCopyState(forLinkedIn ? 'linkedin' : 'copied')
      if (menuRef.current) menuRef.current.open = false
    } catch {
      setCopyState('failed')
    }
  }

  function shareOnLinkedIn() {
    window.open(
      localUrl ? 'https://www.linkedin.com/feed/' : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer',
    )
    void copyLink(true)
  }

  const destinations = [
    { label: 'WhatsApp', href: `https://api.whatsapp.com/send?text=${encodeURIComponent(formatted(labels.whatsappText))}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}` },
    { label: labels.email, href: `mailto:?subject=${encodeURIComponent(labels.emailSubject)}&body=${encodeURIComponent(formatted(labels.emailBody))}` },
  ]

  return <div className="relative shrink-0">
    <details ref={menuRef} className="relative">
      <summary aria-label={copyState === 'copied' || copyState === 'linkedin' ? labels.copied : labels.share} title={labels.share} className="grid size-9 list-none place-items-center border border-(--border) text-(--muted-strong) hover:border-(--signal) hover:text-(--signal) [&::-webkit-details-marker]:hidden">
        {copyState === 'copied' || copyState === 'linkedin' ? <Check size={16} /> : <Share2 size={16} />}
      </summary>
      <div className="absolute right-0 top-full z-30 mt-1 min-w-44 border border-(--border-strong) bg-(--surface-raised) p-1 shadow-lg">
        <button type="button" onClick={() => void copyLink()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--surface)">
          {copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}
          {copyState === 'copied' ? labels.copied : labels.copy}
        </button>
        <button type="button" onClick={shareOnLinkedIn} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--surface)"><Copy size={15} />LinkedIn</button>
        {destinations.map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={() => { if (menuRef.current) menuRef.current.open = false }} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-(--surface)">
            {label === labels.email ? <Mail size={15} /> : <Share2 size={15} />} {label}
          </a>
        ))}
      </div>
    </details>
    <span role="status" className={copyState === 'idle' ? 'sr-only' : 'absolute right-0 top-full z-20 mt-1 w-max max-w-[70vw] bg-(--surface-raised) px-2 py-1 font-mono text-xs text-(--signal)'}>{copyState === 'linkedin' ? labels.linkedinCopy : copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : ''}</span>
  </div>
}
