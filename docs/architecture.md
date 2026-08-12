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
Lambda Function URL
  |
  +--> bearer token validation
  +--> Zod validation
  +--> normalization
  +--> post write
  +--> index updates
  |
  v
S3
```

The Lambda does not call OpenAI in this phase.

## Future autonomous publication

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

private/
  drafts/
  runs/
```

There is no database in the MVP.

## Schemas

Shared Zod schemas live in `packages/schemas` as a plain folder (not a workspace). Both `web` and `lambda` import from it via the `@nexsift/schemas/*` path alias. Changing a schema affects both consumers at type-check time, which is intended: the schema is the contract between publisher and site.

## Environments

Only two infrastructure environments are needed initially:

- local (MiniStack)
- prod (AWS)

Vercel preview deployments provide the web preview layer without a dedicated staging AWS environment.
