'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

let initialized = false

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key || !apiHost || initialized) {
      return
    }

    try {
      // pageview capture is manual (PostHogPageView) because the SDK's built-in
      // SPA tracking is not reliable with the Next.js App Router.
      posthog.init(key, {
        api_host: apiHost,
        capture_pageview: false,
        capture_pageleave: false,
        // Optional PostHog features load external scripts that can crash
        // client-side navigations; only the core tracking is needed here.
        disable_surveys: true,
        disable_dead_clicks_autocapture: true,
        person_profiles: 'identified_only',
      })
      posthog.register({
        application: 'nexsift',
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      })
      initialized = true
    } catch (error) {
      console.error('posthog init failed', error)
    }
  }, [])

  return children
}

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!initialized || !pathname) {
      return
    }

    const url = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}
