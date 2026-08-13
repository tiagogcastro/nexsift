import type { PostDraft } from '@nexsift/schemas/post'

export const MIN_RELEVANCE_SCORE = 6.5
export const MIN_CONFIDENCE_SCORE = 7

export interface GateIssue {
  path: string
  message: string
}

export function validateEditorialGates(draft: PostDraft): GateIssue[] {
  const issues: GateIssue[] = []

  if (draft.relevanceScore < MIN_RELEVANCE_SCORE) {
    issues.push({
      path: 'relevanceScore',
      message: `relevanceScore must be at least ${MIN_RELEVANCE_SCORE}`,
    })
  }

  if (draft.confidenceScore < MIN_CONFIDENCE_SCORE) {
    issues.push({
      path: 'confidenceScore',
      message: `confidenceScore must be at least ${MIN_CONFIDENCE_SCORE}`,
    })
  }

  return issues
}
