'use client'

import { useEffect, type ReactNode } from 'react'
import posthog from 'posthog-js'

let initialized = false

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

    if (!key || initialized) {
      return
    }

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
    initialized = true
  }, [])

  return children
}
