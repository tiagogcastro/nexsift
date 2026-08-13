'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { TrackedLink } from '@/analytics/tracked-link'
import { siteConfig } from '@/config/site'

interface EditorialLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode
}

// Single link renderer for editorial content. External URLs open in a new
// tab with noopener; NexSift-internal links navigate normally in the same
// tab. Exported as a ReactMarkdown component to keep the behavior global.
export function EditorialLink({ href, children, ...props }: EditorialLinkProps) {
  const target = href ?? ''

  if (isExternalUrl(target, siteConfig.url)) {
    return (
      <TrackedLink
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        event="content_link_clicked"
        properties={{ url: target }}
        {...props}
      >
        {children}
      </TrackedLink>
    )
  }

  return (
    <a href={target} {...props}>
      {children}
    </a>
  )
}

function isExternalUrl(href: string, siteUrl: string) {
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
    return false
  }

  try {
    const siteOrigin = new URL(siteUrl).origin
    const targetOrigin = new URL(href, siteUrl).origin
    return targetOrigin !== siteOrigin
  } catch {
    return false
  }
}
