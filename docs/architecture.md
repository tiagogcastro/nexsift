# NexSift Architecture

## Current architecture

```text
                ┌──────────────────────────────────────────┐
                │              AMBIENTE LOCAL               │
                │                                          │
Developer ─────>│  ChatGPT (browser)                       │
                │    │                                     │
                │    │ GPT Action (POST /publish)          │
                │    ▼                                     │
                │  MiniStack :4566                         │
                │    ├── Lambda (validate → normalize →    │
                │    │          write post + update index)  │
                │    └── S3 (nexsift-content-local)        │
                │          │                               │
                │          │ AWS SDK                       │
                │          ▼                               │
                │  Next.js :3000 (SSR from S3)             │
                │    └── Browser                           │
                └──────────────────────────────────────────┘

                ┌──────────────────────────────────────────┐
                │                PRODUÇÃO                   │
                │                                          │
Editor ────────>│  ChatGPT (GPT Action)                    │
                │    │                                     │
                │    ▼                                     │
                │  AWS Lambda Function URL                 │
                │    │ (Bearer token via env var)          │
                │    ▼                                     │
                │  AWS S3 (content bucket)                 │
                │    │                                     │
                │    │ AWS SDK                             │
                │    ▼                                     │
                │  Vercel (Next.js)                        │
                │    ├── PostHog Cloud (free tier)         │
                │    └── site URL                          │
                └──────────────────────────────────────────┘
```

Key properties:

- The site always reads content from S3 (no bundled posts, no `CONTENT_SOURCE` switch).
- The Lambda uses `PUBLISH_TOKEN` from an environment variable, not SSM Parameter Store.
- PostHog Cloud is used in development and production; analytics stays disabled until a key is configured.
- The default locale pt-BR has no URL prefix; `en-US` and `es-ES` keep their prefix.

## Local cloud simulation

```text
Next.js
  |
  v
AWS SDK
  |
  v
MiniStack :4566
  |
  +--> S3
  +--> Lambda
  +--> IAM
```

Terraform targets MiniStack by overriding AWS provider endpoints. The application uses the same AWS SDK clients used later in production.

The local publish flow uses the direct `tsx` invocation against MiniStack, which reads a JSON payload from `packages/dev-publish/payloads/` and invokes the Lambda. It replaces the GPT Action step locally.

## Assisted publication

```text
ChatGPT / NexSift Editor
  |
  | approved PostDraft
  v
GPT Action
  |
  v
API Gateway HTTP API (Function URL for local testing)
  |
  +--> bearer token validation
  +--> Zod validation
  +--> editorial gates (relevanceScore >= 6.5, confidenceScore >= 7)
  +--> source verification (mechanical + editorial assertion)
  +--> normalization
  +--> post write
  +--> index updates
  |
  v
S3
```

The Lambda does not call OpenAI. The publication endpoint also exposes GET with optional filters (`since`, `topic`, `signalType`, `limit`), returning the most recently published signals so the editor can avoid repeating signals across days. Sources are mechanically verified before storage; a rejected source blocks publication (422). Production uses an API Gateway HTTP API because the ChatGPT Actions gateway does not reach `*.lambda-url.*.on.aws` domains; the Lambda Function URL is kept for local flows and rollback.

## Autonomous publication via ChatGPT Tasks

```text
ChatGPT Tasks (Monday and Thursday morning; operational trigger)
  |
  v
NexSift Editor GPT
  |
  +--> GET recent posts (anti-repetition)
  +--> research
  +--> source validation
  +--> draft
  +--> self-review loop
  +--> editorial gates (relevanceScore >= 6.5, confidenceScore >= 7)
  |
  v
POST /publish (same contract)
  |
  v
S3
```

The editor runs without human review and publishes strong signals as soon as they pass the editorial gates. Publication is continuous: the scheduled Tasks are the operational trigger, not a limit (see `docs/editorial.md`). Re-publishing with the same slug updates the signal instead of duplicating it.

## Future autonomous publication via OpenAI API

```text
EventBridge Scheduler
  |
  v
Editorial Lambda
  |
  +--> fetch sources
  +--> filter and deduplicate
  +--> OpenAI API ranking
  +--> writing
  +--> review
  |
  v
same publishPost contract
  |
  v
S3
```

The future automation should reuse the existing schemas and publication logic.

## Storage keys

```text
public/
  posts/{slug}.json
  indexes/latest.json
  indexes/topics/{topic}.json
```

There is no database in the MVP. `indexes/latest.json` is capped at 100 summaries. `private/drafts` and `private/runs` are planned but not implemented.

## Publication endpoints

All routes require `Authorization: Bearer <PUBLISH_TOKEN>`.

- `GET /` (`listRecentPosts`): returns `{ posts: PostSummary[] }` from `indexes/latest.json`; optional query filters `since` (ISO 8601), `topic`, `signalType`, `limit` (default 30, max 100).
- `GET /posts/{slug}` (`getPost`): returns the full signal or 404.
- `POST /` (`publishPost`): upserts a signal. The slug is derived as `{topics[0]}-{slugified title, max 40 chars}-{signalDate}`; publishing the same slug again updates the signal. Rejects drafts below the editorial gates (422). Returns 201 with `{ ok, slug, operation: created|updated, publishedAt, updatedAt }`.
- `POST /validate-source` (`validateSource`): opens and validates a candidate URL; returns 200 with the check result or 422 with the reason when the URL is rejected.
- `POST /audit-sources` (`auditSources`): revalidates all sources of all published signals, refreshes verification records and returns a count per state; use periodically to detect link rot.
- `POST /posts/{slug}/sources/{index}/replace` (`replaceSource`): replaces the source at `index` with a validated `newUrl`; the original URL stays in the replacement history, so link rot is distinguishable from a source that never existed.
- `DELETE /posts/{slug}` (`deletePost`): removes the post object and cleans the latest and topic indexes; 404 when the slug does not exist.

The API Gateway `$default` route and the Lambda Function URL both forward any path to the same handler, which routes on method + path.

## Schemas

Shared Zod schemas live in `packages/schemas` as a yarn workspace resolved through `node_modules`. It exports `./post`, `./source`, `./topic` and `./signal-type`; the depth schema is internal to the package and reachable through the post schema. Both `web` and `lambda` import the raw TypeScript sources. Changing a schema affects both consumers at type-check time, which is intended: the schema is the contract between publisher and site.

## Environments

Only two infrastructure environments are needed initially:

- local (MiniStack)
- prod (AWS)

Vercel preview deployments provide the web preview layer without a dedicated staging AWS environment.
