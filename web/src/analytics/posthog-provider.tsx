'use client'

import { useEffect, type ReactNode } from 'react'
import posthog from 'posthog-js'

let initialized = false

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key || !apiHost || initialized) {
      return
    }

    posthog.init(key, {
      api_host: apiHost,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
    posthog.register({
      application: 'nexsift',
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    })
    initialized = true
  }, [])

  return children
}
