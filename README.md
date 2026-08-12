# NexSift

**Menos ruído. Mais sinal.**

NexSift is a technology intelligence product for developers. It filters, verifies and contextualizes relevant signals across AI, AWS and cloud, software development, DevOps and tech careers.

The product is designed to feel closer to a technical signal console than a traditional blog. Editorial posts are published in pt-BR. Institutional interface copy supports pt-BR, en-US and es-ES.

## Current scope

The repository already contains the foundation for:

- localized Next.js landing page (pt-BR as default locale without URL prefix)
- signal-ledger blog archive
- article pages with visible source rails
- topic pages
- S3 content provider (the site always reads posts from S3)
- MiniStack local AWS simulation
- Terraform for S3, Lambda and IAM
- publication Lambda with Bearer authentication and Zod validation
- local dev publish tool (`yarn dev:publish`)
- RSS, sitemap, robots and Article JSON-LD
- PostHog integration that stays disabled until a key is configured
- GitHub Actions quality pipeline

## Repository

```text
nexsift/
├── web/             Next.js product surface
├── lambda/          publication Lambda and publishing logic
├── packages/
│   ├── schemas/     shared Zod schemas (plain folder, not a workspace)
│   └── dev-publish/ local publish tool and example payloads
├── iac/terraform/   Terraform for MiniStack and AWS
├── docs/            architecture, design and editorial decisions
├── docker-compose.yml   MiniStack local environment
└── .github/         CI
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
cp .env.example .env
```

Running `yarn install` creates `yarn.lock`. Commit that lockfile with the project after the first install.

## Full local AWS simulation

MiniStack runs the AWS-shaped local environment. The site always reads content from S3; there is no bundled content.

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

First time only:

```bash
yarn terraform:init
yarn terraform:local:apply
```

Terraform creates the local S3 bucket, IAM role and publication Lambda inside MiniStack.

### 4. Publish a test post

```bash
yarn dev:publish --file=packages/dev-publish/payloads/example.json
```

The script POSTs the payload to the Lambda, which validates it with Zod, writes the post and updates the S3 indexes.

Check the objects in the local bucket:

```bash
curl "http://localhost:4566/nexsift-content-local?list-type=2"
```

### 5. Run the site

```bash
yarn dev
```

Open:

```text
http://localhost:3000
```

The published post appears in the signal ledger at `/` and at `/blog/{slug}`. `/pt-BR` is the default locale and has no URL prefix; `en-US` and `es-ES` keep their prefix. Old `/pt-BR/*` URLs redirect to the unprefixed form.

## Publish flow

```text
ChatGPT / NexSift Editor
  -> user approval
  -> GPT Action
  -> Lambda Function URL
  -> Zod validation
  -> S3
  -> NexSift
```

Locally, `yarn dev:publish` replaces the GPT Action step: it reads a JSON payload from `packages/dev-publish/payloads/` and invokes the Lambda through MiniStack.

## Vercel MVP

Recommended Vercel setup:

1. import the GitHub repository
2. select `web` as the project root directory
3. keep the detected Next.js framework settings
4. set the environment variables (see below) after Vercel assigns the project URL
5. deploy

Environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app
NEXT_PUBLIC_POSTHOG_KEY=<project-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
CONTENT_BUCKET=<s3-bucket-name>
AWS_REGION=us-east-1
```

The site reads posts from S3, so publishing does not require a redeploy.

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

The GPT Action contract is defined in the OpenAPI spec at `docs/openapi.yaml`.

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

The runtime contract lives in `packages/schemas` and is validated by Zod.

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
/            default locale (pt-BR), no prefix
/about
/blog
/blog/{slug}
/topics/{topic}

/en-US
/en-US/about
/es-ES
/es-ES/about

/feed.xml
/sitemap.xml
/robots.txt
```

Editorial content remains in pt-BR. English and Spanish users are redirected to the unprefixed blog for articles.

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

## Licensing

Code, configuration and infrastructure in this repository are licensed under
the MIT License. See `LICENSE`. Copyright (c) 2026 Tiago Gonçalves de Castro.

Editorial content (posts, analyses and briefings published through the
NexSift pipeline) is licensed under CC BY-NC-ND 4.0: attribution to
Tiago Gonçalves de Castro is mandatory, commercial use and derivatives are
not allowed, and attributing authorship to third parties (including AI
systems) is explicitly forbidden. See `LICENSE-CONTENT.md`.

If the project grows, consider registering the software (programa de
computador) and the NexSift trademark at INPI, and submit the site to
Google Search Console and Bing Webmaster Tools.
