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
- useful to people who build, operate, design or decide about technology, with development as the main editorial bias

Avoid clickbait, empty superlatives and claims that cannot be traced to a source.

## Vocabulary

- Sinal: the editorial unit NexSift publishes. A signal is a verifiable change in the technology ecosystem that alters a decision, risk, opportunity or mental map relevant to the audience. NexSift does not publish something just because it happened.
- Tópico: the thematic category of a signal.
- Ritmo editorial: the publication cadence. NexSift is always updated with the week's news; strong signals are published as soon as they pass the gate, without waiting for a fixed edition. The word "frequência" must not be used for topics or cadence.
- Internally, the API and schema may keep the `post` naming; product language always uses Sinal.

## Audience

People who build, operate, design or make decisions about technology. Developers remain the gravitational center: DevOps, SRE, platform engineers, security engineers, designers, engineering managers, technical founders, architects and infrastructure professionals are also part of the audience. NexSift is not a generic tech portal.

## Signal structure

A signal should answer:

1. O sinal: what happened.
2. O que mudou: the concrete change.
3. Por que importa: the practical consequence, without reproducing marketing.
4. Quem deve prestar atenção: who is actually affected.
5. O que observar agora: the next action, decision or relevant variable (test, update, migrate, benchmark, track, review cost, review security, wait for GA, no immediate action).

## Topics

- `ai`
- `development`
- `cloud`
- `devops`
- `security`
- `industry`
- `design`

`industry` means exclusively the technology industry, tech market and tech ecosystem: tech job market, acquisitions, relevant layoffs, relevant funding, open source governance, licensing, technology regulation, software/cloud/AI economics, platform strategy, moves by large technology companies, salaries and careers backed by strong data. It does not mean generic industry (oil, mining, agriculture, manufacturing, construction, heavy industry); those sectors only enter when there is a technology consequence directly relevant to the audience.

There are no topic quotas. The goal is to find the best signals of the period. A topic may have zero signals in an edition. Prefer at most 2 signals of the same topic per edition, with exceptions only when editorially justified. Never lower the gate to fill space.

## Classification

- `signalType`: `release` | `risk` | `shift` | `research` | `industry` | `opportunity`.
- `depth`: `practical` (useful to a broad tech audience without being overly basic) or `deep` (architecture, protocols, infrastructure, internals, security, runtimes, research, or subjects requiring more technical context). There is no beginner level.
- `signalDate`: the actual date of the event. `publishedAt` is when NexSift published it. `updatedAt` is when the published content received a material update. A signal only receives an update when there is material news (beta became GA, incident got a root cause, CVE got a patch, rollout paused, price changed, official information corrected, availability changed). Never update just because the editor reread the content.

## Relevance and confidence

`relevanceScore` ranges from 0 to 10 and is editorial data, not decoration:

- 9.0-10: exceptional
- 8.0-8.9: strong
- 7.0-7.9: relevant
- 6.0-6.9: useful to a specific segment
- below 6: do not publish

Scoring considers impact, novelty, practicality, breadth and source credibility.

`confidenceScore` ranges from 0 to 10 and measures how solid the evidence is and how reliable the interpretation is. High relevance does not compensate for low confidence.

Publication floor (enforced by the Lambda): `relevanceScore >= 6.5` and `confidenceScore >= 7`.

## Editorial cadence

Main routine: publish strong signals as soon as they pass the gate; the default operational trigger runs twice a week, but it is not a publication limit. Research signals since the last edition. An older signal may be recovered when it is still relevant, has not been published, and still represents a material change.

Geographic rule: actively search for signals from Brazil, Latin America and the rest of the world. Geographic origin does not change the editorial gate. Do not publish weak Brazilian content for diversity, and do not ignore strong Brazilian content.

## Source policy

Prefer primary sources for technical claims:

1. official documentation
2. official changelogs and engineering blogs
3. original research or announcements
4. reputable secondary reporting when primary material is insufficient

Community posts can identify a signal but should not be the only basis for a material factual claim when a stronger source exists.

## AI policy

The assisted workflow is human approved:

1. research in ChatGPT
2. draft in pt-BR
3. source review
4. user approval
5. GPT Action calls the publish Lambda
6. Lambda validates, applies the editorial gates and publishes

The autonomous workflow replaces steps 1 to 4 with a scheduled GPT run that self-reviews and publishes without human review:

1. GET recent posts since the last edition (anti-repetition)
2. research
3. draft in pt-BR
4. self-review loop (hype, source quality, novelty, contract limits)
5. editorial gates (relevanceScore >= 6.5, confidenceScore >= 7)
6. GPT Action calls the publish Lambda
7. Lambda validates and publishes

The future API-driven editorial Lambda can replace the ChatGPT run while preserving the same publication contract.
