'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function HashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash

    if (!hash) {
      return
    }

    const scroll = () => {
      document
        .querySelector(hash)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    scroll()

    const retry = window.setTimeout(scroll, 200)

    return () => window.clearTimeout(retry)
  }, [pathname])

  return null
}
