const retryDelaysMs = [500, 1500, 3000]

export class UpstreamRequestError extends Error {
  constructor(
    message: string,
    public readonly code: 'UPSTREAM_TIMEOUT' | 'SOURCE_UNAVAILABLE',
    public readonly attempt: number,
  ) {
    super(message)
    this.name = 'UpstreamRequestError'
  }
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { timeoutMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 10_000
  const maxAttempts = retryDelaysMs.length + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (isRetryableStatus(response.status) && attempt < maxAttempts) {
        await waitForRetry(attempt)
        continue
      }

      return { response, attempt }
    } catch (error) {
      if (!isRetryableError(error) || attempt >= maxAttempts) {
        throw createUpstreamRequestError(error, attempt)
      }

      await waitForRetry(attempt)
    }
  }

  throw new UpstreamRequestError('Retry exhausted', 'SOURCE_UNAVAILABLE', maxAttempts)
}

export function isRetryableStatus(status: number) {
  return status === 429 || status >= 500
}

function isRetryableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name === 'TimeoutError' ||
    error.name === 'AbortError' ||
    error.name === 'TypeError'
  )
}

function createUpstreamRequestError(error: unknown, attempt: number) {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return new UpstreamRequestError(error.message, 'UPSTREAM_TIMEOUT', attempt)
    }

    return new UpstreamRequestError(error.message, 'SOURCE_UNAVAILABLE', attempt)
  }

  return new UpstreamRequestError(
    'Upstream request failed',
    'SOURCE_UNAVAILABLE',
    attempt,
  )
}

function waitForRetry(attempt: number) {
  const baseDelay = retryDelaysMs[attempt - 1] ?? 0
  const jitter = Math.floor(Math.random() * 200)

  return new Promise((resolve) => {
    setTimeout(resolve, baseDelay + jitter)
  })
}
