'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { captureEvent } from './events'

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: string
  properties?: Record<string, string | number | boolean>
  children: ReactNode
}

export function TrackedLink({
  event,
  properties,
  children,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(clickEvent) => {
        captureEvent(event, properties)
        onClick?.(clickEvent)
      }}
    >
      {children}
    </a>
  )
}
