# NexSift Agent Guide

## Project intent

NexSift is a technology intelligence product for developers. It filters, verifies and contextualizes relevant signals across AI, AWS and cloud, software development, DevOps and tech careers.

The product must feel like an editorial intelligence tool, not a generic blog template or personal portfolio.

## Repository structure

- `web/`: Next.js product surface.
- `lambda/`: AWS Lambda handlers and publication logic.
- `packages/schemas/`: shared Zod schemas as a yarn workspace (`@nexsift/schemas`) resolved via `node_modules`, so both web and lambda consume the same TS sources.
- `packages/dev-publish/`: local publish tool and example payloads.
- `iac/terraform/`: Terraform for MiniStack and AWS.
- `docs/`: architecture, design and editorial decisions.
- `docker-compose.yml`: MiniStack local environment (S3, Lambda, IAM).

Do not introduce new top-level layers without a concrete need.

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

- Editorial posts are written in pt-BR.
- Institutional UI may be translated to pt-BR, en-US and es-ES.
- Do not use the Unicode em dash character in NexSift product or editorial copy.
- Prefer periods, commas, colons, parentheses or a normal hyphen when punctuation is needed.
- Avoid clickbait, hype and unsupported claims.
- Distinguish verified facts from NexSift analysis.

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
- Keep commits focused on one coherent change.

Before committing when practical, run:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

## Scope discipline

The MVP does not need a database, Redis, Kubernetes, GraphQL, NestJS, Turborepo, Nx, microservices or a full CMS.

Prefer the smallest solution that preserves the agreed path from local MiniStack to AWS production.
