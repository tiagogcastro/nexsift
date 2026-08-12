# NexSift Architecture

## MVP

```text
GitHub
  |
  v
Vercel
  |
  v
Next.js
  |
  +--> bundled bootstrap content for the first free deployment
  |
  +--> S3 content provider when enabled
```

The first public deployment can run with bundled bootstrap posts and no AWS bill.

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
  +--> SSM
```

Terraform targets MiniStack by overriding AWS provider endpoints. The application uses the same AWS SDK clients used later in production.

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

## Environments

Only two infrastructure environments are needed initially:

- local
- prod

Vercel preview deployments provide the web preview layer without a dedicated staging AWS environment.
