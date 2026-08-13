import type { VerifiedPostSource } from '@nexsift/schemas/source'
import type { PostSummary } from '@nexsift/schemas/post'

// A source is considered verified when the backend's mechanical check
// succeeded (healthy or redirected to the real article). Absence of a
// verification record means the source has not been verified yet, so it
// cannot count as verified.
export function isSourceVerified(source: VerifiedPostSource | undefined) {
  return (
    source?.sourceStatus === 'healthy' ||
    source?.sourceStatus === 'redirected'
  )
}

// Metric used by the radar: percentage of selected signals where every
// source is verified. Recommended interpretation: "% de sinais selecionados
// em que todas as fontes estão verificadas".
export function verifiedSignalsRatio(signals: PostSummary[]) {
  if (signals.length === 0) {
    return 0
  }

  const fullyVerified = signals.filter((signal) =>
    signal.sources.every(isSourceVerified),
  ).length

  return fullyVerified / signals.length
}
