export interface RequestContext {
  requestId: string
  correlationId: string
}

export function logInfo(event: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify(logEntry('INFO', event, fields)))
}

export function logError(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify(logEntry('ERROR', event, fields)))
}

export function approximateJsonSize(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

export function errorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const candidate = error as Error & {
    cause?: unknown
    name?: string
    stack?: string
  }

  return {
    name: candidate.name,
    message: candidate.message,
    cause:
      candidate.cause instanceof Error
        ? {
            name: candidate.cause.name,
            message: candidate.cause.message,
          }
        : candidate.cause,
  }
}

function logEntry(
  level: 'INFO' | 'ERROR',
  event: string,
  fields: Record<string, unknown>,
) {
  return {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  }
}
