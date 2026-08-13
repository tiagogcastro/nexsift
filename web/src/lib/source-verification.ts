import type { VerifiedPostSource } from '@nexsift/schemas/source'
import type { PostSummary } from '@nexsift/schemas/post'

// A source is currently verifiable when the latest mechanical check shows
// the page accessible: healthy, redirected to the real page, or replaced by
// a validated copy (which carries its own successful check by construction).
export function isSourceCurrentlyVerifiable(
  source: VerifiedPostSource | undefined,
) {
  if (!source) {
    return false
  }

  if (
    source.sourceStatus === 'healthy' ||
    source.sourceStatus === 'redirected'
  ) {
    return true
  }

  return (
    source.sourceStatus === 'replaced' &&
    source.lastSuccessfulAt !== undefined
  )
}

// A source was verified at publication when the backend recorded the check
// that happened immediately before the post was stored.
export function isSourcePublicationVerified(
  source: VerifiedPostSource | undefined,
) {
  return source?.verifiedAtPublication === true
}

// Percentage of sources that are accessible and verifiable right now. The
// denominator is every source of the selected signals, so link rot,
// temporary outages and anti-bot walls lower the number honestly.
export function verifiableSourcesRatio(signals: PostSummary[]) {
  const sources = signals.flatMap((signal) => signal.sources)

  if (sources.length === 0) {
    return 0
  }

  const verifiable = sources.filter(isSourceCurrentlyVerifiable).length

  return verifiable / sources.length
}

// Percentage of sources that were verified immediately before publication.
// New signals must always reach 100%; older content may sit below it when
// it predates the verification gate.
export function publicationVerifiedSourcesRatio(signals: PostSummary[]) {
  const sources = signals.flatMap((signal) => signal.sources)

  if (sources.length === 0) {
    return 0
  }

  const verified = sources.filter(isSourcePublicationVerified).length

  return verified / sources.length
}

// i18n key for the per-source status chip. A broken source is only called
// "compromised" when it never had a successful check; otherwise it is link
// rot, which says nothing about editorial quality.
export function sourceStatusLabelKey(source: VerifiedPostSource | undefined) {
  if (!source) {
    return 'unknown'
  }

  switch (source.sourceStatus) {
    case 'healthy':
      return 'healthy'
    case 'redirected':
      return 'redirected'
    case 'replaced':
      return 'replaced'
    case 'temporarily_unavailable':
      return 'temporarilyUnavailable'
    case 'blocked':
      return 'blocked'
    case 'broken':
      return source.lastSuccessfulAt ? 'linkRot' : 'compromised'
    default:
      return 'unknown'
  }
}
