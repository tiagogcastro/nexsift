# NexSift

**Menos ruído. Mais sinal.**

NexSift is a technology intelligence product for developers. It filters, verifies and contextualizes relevant signals across AI, AWS and cloud, software development, DevOps and tech careers.

The product is designed to feel closer to a technical signal console than a traditional blog. Editorial posts are published in pt-BR. Institutional interface copy supports pt-BR, en-US and es-ES.

## Current scope

The repository already contains the foundation for:

- localized Next.js landing page
- signal-ledger blog archive
- article pages with visible source rails
- topic pages
- bundled bootstrap content for a zero-cost first Vercel deploy
- optional S3 content provider
- MiniStack local AWS simulation
- Terraform for S3, Lambda, IAM and SSM
- publication Lambda with Bearer authentication and Zod validation
- GPT Action OpenAPI contract
- RSS, sitemap, robots and Article JSON-LD
- PostHog integration that stays disabled until a key is configured
- GitHub Actions quality pipeline

## Repository

```text
nexsift/
├── web/          Next.js product surface
├── lambda/       publication Lambda and publishing logic
├── contracts/    shared Zod schemas and OpenAPI contract
├── iac/          MiniStack and Terraform
├── scripts/      seed and operational data
├── docs/         architecture, design and editorial decisions
└── .github/      CI
```

See `AGENTS.md` before making structural or style changes.

## Stack

- Node.js 22
- TypeScript
- Yarn 4 workspaces with `node_modules`
- Next.js
- React
- Tailwind CSS
- next-intl
- Zod
- AWS SDK for JavaScript v3
- AWS S3
- AWS Lambda
- AWS IAM
- AWS SSM Parameter Store
- Terraform
- Docker Compose
- MiniStack
- PostHog
- Vercel

OpenAI API is intentionally not required for the first version.

## First local run

### Requirements

Install:

- Node.js 22
- Corepack
- Docker
- Terraform 1.11+

Then:

```bash
corepack enable
yarn install
cp web/.env.example web/.env.local
yarn dev
```

Open:

```text
http://localhost:3000
```

The default `CONTENT_SOURCE=filesystem` reads the bootstrap posts from `web/content/posts`. This is the mode intended for the first zero-cost Vercel deployment.

Running `yarn install` creates `yarn.lock`. Commit that lockfile with the project after the first install.

## Full local AWS simulation

MiniStack runs the AWS-shaped local environment.

### 1. Start MiniStack

```bash
yarn infra:up
```

Health check:

```bash
curl http://localhost:4566/_ministack/health
```

### 2. Build the Lambda

```bash
yarn lambda:build
```

### 3. Initialize and apply Terraform

```bash
yarn terraform:init
yarn terraform:local:apply
```

Terraform creates the local S3 bucket, SSM parameter, IAM role and publication Lambda.

### 4. Seed S3

```bash
yarn seed
```

### 5. Make the web app read from S3

Change `web/.env.local`:

```env
CONTENT_SOURCE=s3
CONTENT_BUCKET=nexsift-content-local
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

Then:

```bash
yarn dev
```

The same pages now read through the AWS SDK from MiniStack S3.

## Test local publication

Get the local Function URL:

```bash
terraform -chdir=iac/terraform output -raw publish_function_url
```

Use the URL returned by Terraform:

```bash
curl -X POST '<FUNCTION_URL>' \
  -H 'Authorization: Bearer local-dev-token-change-me' \
  -H 'Content-Type: application/json' \
  --data @scripts/data/publish-example.json
```

The Lambda validates the payload, writes the post and updates the S3 indexes.

## Vercel MVP

For the first deployment, keep:

```env
CONTENT_SOURCE=filesystem
```

Recommended Vercel setup:

1. import the GitHub repository
2. select `web` as the project root directory
3. keep the detected Next.js framework settings
4. set `NEXT_PUBLIC_SITE_URL` after Vercel assigns the project URL
5. deploy

No AWS resource or OpenAI API key is required for this phase.

## Assisted publication phase

The next publishing flow is:

```text
ChatGPT / NexSift Editor
  -> user approval
  -> GPT Action
  -> Lambda Function URL
  -> Zod validation
  -> S3
  -> NexSift
```

`contracts/openapi.yaml` defines the GPT Action contract.

The ChatGPT step handles research, writing and review. The Lambda only validates and publishes.

## Future automated phase

After the product is validated, the editorial source can change without changing the web or post contract:

```text
EventBridge Scheduler
  -> editorial Lambda
  -> source ingestion
  -> deterministic filtering
  -> OpenAI API ranking and writing
  -> review
  -> existing publishPost flow
  -> S3
```

The OpenAI API is therefore an optional future automation dependency, not an MVP requirement.

## Content model

Posts use JSON with Markdown in `content`.

Core fields:

```text
type
slug
title
description
content
whyItMatters
topics
tags
sources
publishedAt
readingTime
relevanceScore
locale
```

The runtime contract lives in `contracts/src` and is validated by Zod.

## Content storage

Target S3 layout:

```text
public/
├── posts/{slug}.json
└── indexes/
    ├── latest.json
    └── topics/{topic}.json

private/
├── drafts/
└── runs/
```

A database is not part of the MVP.

## Product routes

```text
/pt-BR
/en-US
/es-ES

/{locale}/about

/pt-BR/blog
/pt-BR/blog/{slug}
/pt-BR/topics/{topic}

/feed.xml
/sitemap.xml
/robots.txt
```

Editorial content remains in pt-BR. English and Spanish users are redirected to the pt-BR blog for articles.

## Design and editorial references

Read:

- `docs/design.md`
- `docs/editorial.md`
- `docs/architecture.md`
- `docs/roadmap.md`

## Quality commands

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

## Git conventions

Use Conventional Commits without co-author trailers.

Examples:

```text
feat: add localized landing page
feat: add S3 content provider
fix: preserve publication timestamp on update
```
