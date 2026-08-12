# NexSift Editorial System

## Language

Posts are published in pt-BR. Product interface text may exist in pt-BR, en-US and es-ES.

## Voice

NexSift writing should be:

- direct
- technical
- source grounded
- skeptical of hype
- clear about what changed
- useful to developers and cloud professionals

Avoid clickbait, empty superlatives and claims that cannot be traced to a source.

## Article questions

A useful article should answer most of these questions:

1. What happened?
2. What changed technically?
3. Why does it matter?
4. Who is affected?
5. What should a developer watch or do next?
6. Which sources support the claims?

## Content types

### article

A focused analysis of one development.

### daily-briefing

A curated set of a few signals published as one briefing. The briefing is a future content format and uses the same post contract.

## Topics

- `ai`
- `aws-cloud` (published label "Cloud"; a dedicated AWS topic may split out later)
- `development`
- `devops`
- `career` (published label "Carreira & Vagas", covers jobs, salaries and market moves)
- `finance`

## Relevance score

`relevanceScore` ranges from 0 to 10. It is editorial data, not decoration.

Future automated ranking should consider:

- technical impact
- novelty
- practical relevance
- source credibility
- breadth of affected developers

The score should not be presented when the system has no basis for it.

## Source policy

Prefer primary sources for technical claims:

1. official documentation
2. official changelogs and engineering blogs
3. original research or announcements
4. reputable secondary reporting when primary material is insufficient

Community posts can identify a signal but should not be the only basis for a material factual claim when a stronger source exists.

## AI policy

The initial workflow is human approved:

1. research in ChatGPT
2. draft in pt-BR
3. source review
4. user approval
5. GPT Action calls the publish Lambda
6. Lambda validates and publishes

The future automated workflow can replace steps 1 to 4 with an API-driven editorial Lambda while preserving the same publication contract.
