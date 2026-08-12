'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

let initialized = false

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key || !apiHost || initialized) {
    return
  }

  try {
    // pageview capture is manual (PostHogPageView) because the SDK's built-in
    // SPA tracking is not reliable with the Next.js App Router. Optional
    // features load external scripts that can crash client navigations.
    posthog.init(key, {
      api_host: apiHost,
      capture_pageview: false,
      capture_pageleave: false,
      disable_surveys: true,
      disable_external_dependency_loading: true,
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
}

// Runs on the client when the bundle hydrates, so PostHogPageView can
// capture the first pageview before its effect runs.
if (typeof window !== 'undefined') {
  initPostHog()
}

export function PostHogProvider({ children }: { children: ReactNode }) {
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
