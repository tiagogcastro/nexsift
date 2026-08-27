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

The Lambda does not call OpenAI. The publication endpoint also exposes GET with optional filters (`since`, `topic`, `signalType`, `query`, `tag`, `limit`, `offset`), returning the most recently published signals so the editor can avoid repeating signals across days. Sources are mechanically verified before storage; a rejected source blocks publication (422). Production uses an API Gateway HTTP API because the ChatGPT Actions gateway does not reach `*.lambda-url.*.on.aws` domains; the Lambda Function URL is kept for local flows and rollback.

## Autonomous publication via ChatGPT Tasks

```text
ChatGPT Task (daily; operational trigger)
  |
  v
ChatGPT connector (MCP over the mcp Lambda Function URL)
  |
  +--> editorialInstructions (editorial sources of truth)
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

The editor runs without human review and publishes strong signals as soon as they pass the editorial gates. Publication is continuous: the scheduled Task is the operational trigger, not a limit (see `docs/editorial.md`). Re-publishing with the same slug updates the signal instead of duplicating it.

The `mcp` Lambda exposes the publication contract as MCP tools (stateless streamable HTTP transport, JSON responses, Function URL in BUFFERED mode) and bundles the editorial instructions (`docs/gpt-editor-instructions.md`, `docs/gpt-editor-reference.md`, `docs/gpt-editor-payload-reference.md`) into the `editorialInstructions` tool. ChatGPT Tasks cannot use Custom GPTs or Actions, so the connector replaces the GPT Action for scheduled runs; the GPT Action remains available for interactive sessions.

The scheduled routine now prefers `listRecentPosts(detail=compact)` for coverage checks and discovery context, uses `resolvePost` for exact deduplication with the backend slug function, and keeps running in degraded mode when recent-list retrieval fails but per-candidate deduplication still works.

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
  images/*
```

There is no database in the MVP. `indexes/latest.json` is capped at 100 summaries. Each topic index (`indexes/topics/{topic}.json`) lists only signals whose `topic` is that topic; `relatedTopics` are contextual metadata and never place a signal on a topic page. The audit routine derives all index files from the stored posts on every run, so drift self-heals. `private/drafts` and `private/runs` are planned but not implemented.

## Publication endpoints

All routes require `Authorization: Bearer <PUBLISH_TOKEN>`.

- `GET /` (`listRecentPosts`): returns recent signals from `indexes/latest.json`; optional query filters `since` (ISO 8601), `topic`, `signalType`, `query` (case-insensitive match over title, description and tags), `tag` (exact, case-insensitive), `limit` (default 30, max 100), `offset` (pagination) and `detail` (`full` or `compact`). The response carries `total`, the number of matches before pagination. Compact mode is the preferred editorial context list because it omits heavy source arrays.
- `POST /posts/resolve` (`resolvePost`): resolves `{ title, topic, signalDate }` with the exact backend slug function and returns `{ exists, slug, post? }` for deduplication without reproducing slug logic in the editor.
- `GET /posts/{slug}` (`getPost`): returns the full signal or 404.
- `POST /` (`publishPost`): creates a signal when `slug` is omitted and updates the existing identity when `slug` is supplied. Creation derives `{topic}-{slugified title, max 40 chars}-{signalDate}`; updates preserve omitted fields and never recalculate the URL after a title change. Unknown update slugs return 404. Optional `publishedAt` defaults to now on creation, is preserved when omitted on update and rejects future values (422). Returns 201 with `{ ok, slug, operation: created|updated, publishedAt, updatedAt }`.
- `POST /validate-source` (`validateSource`): opens and validates a candidate URL; returns 200 with the check result, 422 for permanent rejection and 503/504 for retryable upstream failures.
- `POST /audit-sources` (`auditSources`): revalidates all sources of all published signals in storage, refreshes verification records and returns a count per state; use periodically to detect link rot.
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
