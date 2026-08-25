# NexSift Agent Guide

## Project intent

NexSift is a technology intelligence product for developers. It filters, verifies and contextualizes relevant signals across AI, AWS and cloud, software development, DevOps and tech careers.

The product must feel like an editorial intelligence tool, not a generic blog template or personal portfolio.

## Repository structure

- `web/`: Next.js product surface (reads posts from S3 only, no bundled content).
- `lambda/`: AWS Lambda handler (`src/publish/handler.ts`) and publishing pipeline (`src/publishing/`).
- `packages/schemas/`: shared Zod schemas as a yarn workspace (`@nexsift/schemas`) resolved via `node_modules`, so both web and lambda consume the same TS sources. The schema is the contract between publisher and site.
- `packages/dev-publish/`: local publish tool (`publish.ts`, `reset.ts`) and example payloads.
- `iac/modules/content-stack/`: shared Terraform module (S3 content bucket, publish Lambda, API Gateway, IAM).
- `iac/environments/local/`: MiniStack local environment (terraform.tfvars committed).
- `iac/environments/prod/`: AWS production environment (terraform.tfvars gitignored).
- `docs/`: architecture, design and editorial decisions; `docs/openapi.yaml` and `docs/gpt-editor-*.md` define the GPT Action contract.
- `data/`: MiniStack local state (S3, PostHog, Terraform), gitignored.
- `docker-compose.yml`: MiniStack local environment (S3, Lambda, IAM).

Do not introduce new top-level layers without a concrete need.

## Setup

- Node 22 (`.nvmrc`), Yarn 4.9.2 via Corepack. Yarn is not committed, so run `corepack enable` before `yarn install` on a fresh machine.
- `web/.env.local` and `.env` come from their `.env.example`; `.env` holds the local MiniStack publish URL and token.
- `.opencode/opencode.json` is local-only (gitignored); never track it and never inline API keys in it, use `{env:...}` or file references outside the repo.
- Full MiniStack + publish + dev-server runbook is in `README.md` (sections "Full local AWS simulation" and "Publish flow").

## Commands

```bash
yarn dev                                   # web only
yarn lint                                  # web only; lambda has no lint script
yarn typecheck                             # lambda + web
yarn build                                 # lambda first, then web
yarn workspace @nexsift/web icons:generate # regenerate favicon/icon PNGs from src/app/icon.svg
```

- This project has no tests and none should ever be added: no test files, no test dependencies, no test scripts.
- Lambda must be built (`yarn workspace @nexsift/lambda build`) before `terraform apply` or any local publish; Terraform zips `lambda/dist/publish/index.js` and `lambda/dist/mcp/index.js`.
- `yarn build` in CI sets `NEXT_PUBLIC_SITE_URL` for the web build.

## Publishing pipeline

- All endpoints require `Authorization: Bearer <PUBLISH_TOKEN>`: `POST /` (upsert signal), `GET /` (recent signals with `since`, `topic`, `signalType`, `query`, `tag`, `limit` and `offset` filters, plus `total`), `GET /posts/{slug}`, `POST /validate-source`, `POST /audit-sources`, `POST /posts/{slug}/sources/{index}/replace`, `DELETE /posts/{slug}`.
- Editorial gates: `relevanceScore >= 6.5` and `confidenceScore >= 7`; drafts below the gates are rejected with 422.
- Slug is derived as `{topics[0]}-{slugified title, max 40 chars}-{signalDate}`; republishing the same slug updates the signal.
- Sources are mechanically verified before publication (`validate-source.ts`, `audit-sources.ts`); verification fields, editorial status and source replacement are part of the post contract. Changing the Lambda contract also means updating `docs/openapi.yaml` and the `docs/gpt-editor-*.md` files.
- Cover images (`coverImage`) and inline images in the markdown content are downloaded and validated at publication time and stored as snapshots in the content bucket (`fetch-image.ts`, `inline-images.ts`); the site serves them from its own origin via the `/s3/[...key]` route instead of hotlinking the source host. Stored copies a post no longer references are deleted on republish.
- Prod is fronted by an API Gateway HTTP API, not the Function URL (ChatGPT Actions cannot reach `*.lambda-url.*.on.aws`); the Function URL remains for local flows and rollback.

## Code conventions

- Use TypeScript.
- Use single quotes in TypeScript and JavaScript.
- Prefer named `function` declarations for functions and React components.
- Use arrow functions for callbacks.
- Use `camelCase` for variables and functions.
- Use `PascalCase` for components and types.
- Code and code comments are written in English.
- Comments exist only for non-obvious constraints or decisions. Do not narrate what the code already says.
- Avoid generic folders such as `utils`, `common`, `shared`, `core` or `helpers` unless their scope is concrete and justified.
- Avoid barrel export chains. Export only where they make imports materially clearer.
- Do not add architectural layers, dependencies or patterns only for abstraction.
- Validate external data, S3 content and AI-produced payloads with Zod at boundaries.

## Product copy

- Editorial posts are written in pt-BR; product language calls posts "Sinais" (signal), never the internal `post` name.
- Institutional UI may be translated to pt-BR, en-US and es-ES.
- Do not use the Unicode em dash character in NexSift product or editorial copy.
- Prefer periods, commas, colons, parentheses or a normal hyphen when punctuation is needed.
- Avoid clickbait, hype and unsupported claims.
- Distinguish verified facts from NexSift analysis.
- Publication is continuous: signals publish as soon as they pass the gate, there is no fixed edition or cadence.

## Design

- Keep the dark graphite visual system and signal-ledger concept defined in `docs/design.md`.
- Do not turn the interface into a generic grid of rounded blog cards.
- Use design tokens from `web/src/app/globals.css` instead of arbitrary hex colors in components.
- Use topic colors as semantic accents, not as large decorative fills.
- Prefer typography, spacing, borders and information density over shadows and decoration.

## Git

- Use Conventional Commits.
- Do not add co-author trailers.
- Do not add assistant or model attribution to commits.
- Suggested branches: `feat/NS-001-foundation`, `fix/NS-###-description`.
- Feature branches go to `develop`; `develop` is merged into `main` via PR (all PRs so far follow this path). CI runs lint, typecheck and build on PRs and pushes to `main`.
- Keep commits focused on one coherent change.

Before committing when practical, run:

```bash
yarn lint
yarn typecheck
yarn build
```

## Scope discipline

The MVP does not need a database, Redis, Kubernetes, GraphQL, NestJS, Turborepo, Nx, microservices or a full CMS.

Prefer the smallest solution that preserves the agreed path from local MiniStack to AWS production.

Local-only artifacts must never be committed or kept around: `data/` holds MiniStack state, build output goes to `dist/`, `*.tsbuildinfo` and `.terraform/` caches regenerate automatically, and completed planning docs in `docs/superpowers/` are deleted when the work ships.

## Production content

Prod content is published only through the NexSift Editor GPT flow. Never publish test or example payloads to the prod endpoint; `packages/dev-publish` refuses production targets without `--allow-prod`, and `--allow-prod` is not to be used for test content.
