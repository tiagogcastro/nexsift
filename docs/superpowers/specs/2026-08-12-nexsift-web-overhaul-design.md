# NexSift Web Overhaul Design

Date: 2026-08-12

Status: approved

## Goal

Evolve the NexSift web surface without changing its identity: a signal console
with editorial depth, dark graphite, chartreuse accent, Geist typography. This
spec covers brand assets, i18n completeness, blog console capabilities
(search, filters, counts, ordering, pagination), navigation affordances,
landing volume, licensing and a security audit.

Scope is `web/` plus one approved exception: adding `updatedAt` to
`postSummarySchema` in `packages/schemas/post.ts`. `lambda/`, `iac/`,
`docker-compose.yml` and the rest of `packages/schemas` are out of scope.

## Approved decisions

| Decision | Choice |
| --- | --- |
| Logo direction | N/ monogram with signal dot (SVG component + favicon SVG + apple icon PNG via next/og) |
| AI notice | Footer global (short) + article left rail (full) |
| Breadcrumb | Article and topic pages, mono/ledger style with topic color |
| Topics i18n | Move labels/shortLabels/descriptions to messages in 3 locales now |
| Pagination | Load more, 20 per batch, client-side over the loaded index |
| Recently updated | Order toggle on /blog (recentes vs atualizados), requires updatedAt in index schema |
| Colors | Token consistency only, no palette changes; audit chartreuse button contrast |
| OG image | Static brand OG updated with new mark + dynamic per-post OG for blog slugs |
| Licenses | Code MIT, editorial content CC BY-NC-ND 4.0, both with Tiago Goncalves de Castro as author, explicit no-misattribution clause |
| Open source | Publish to GitHub later, after this cycle |
| Landing copy | Adjust titles/descriptions (3 locales), not a full rewrite |
| Search | Hybrid: URL params (?q, ?topic, ?sort) read server-side for first render; client refines and syncs URL (debounced) |
| Filters | Topic chips on /blog with topic colors |
| Counts | From the loaded index (100-post window), honest mono labels |
| Active nav | Signal underline/dot; "Tópicos" lights with the page topic color |
| Landing volume | Stats band + recently updated (top 5 by updatedAt) + how to follow (RSS) |

## Architecture

### Blog console (server + client)

`/blog` becomes a console:

- `app/[locale]/blog/page.tsx` (server): reads `searchParams` (`q`, `topic`,
  `sort`), fetches the index from S3, filters server-side, renders the shell
  and passes the full index plus initial state to the client console.
- `features/blog/ledger-console.tsx` (client): owns query, active topic,
  sort order and visible count. Seeds state from URL params, debounces the
  query input and syncs the URL with `router.replace` so states stay
  shareable. Never imports `content.ts` or `process.env`; receives posts as
  props.
- `features/blog/order-toggle.tsx` (client): "recents" vs "recently updated"
  ordering. `sort=updated` sorts by `updatedAt ?? publishedAt`.
- Load more reveals 20 rows per click, button hidden when nothing remains.

Same console reuse on topic pages is not required: topic pages keep the
server-filtered ledger (topic is already fixed by the route). They get load
more only, via the shared client list.

### Landing sections

- `features/landing/stats-band.tsx`: mono numbers from the index (signals
  published, active frequencies, average relevance).
- Recently updated section: top 5 by `updatedAt ?? publishedAt`, rendered
  with the existing `SignalLedger` limit.
- How to follow section: RSS feed link and /blog link.
- Existing sections unchanged in structure.

### Navigation

- `components/nav-links.tsx` (client): `usePathname` based active state.
  Active link gets a signal dot/underline; on `/topics/{topic}` the
  "Tópicos" link uses the topic color. Uses `data-topic` + `topic-color`
  classes already present.
- `components/logo-mark.tsx`: SVG monogram N/ with signal dot, size prop.
  Used by `brand.tsx`, favicon (`app/icon.svg`), apple icon
  (`app/apple-icon.tsx` via ImageResponse) and the OG images.

### Breadcrumbs

- `features/blog/breadcrumbs.tsx`: mono rows, topic color accent.
  Article: Home / Blog / [Tópico] / Título. Topic: Home / Tópicos / [Tópico].

### i18n structure

Topics move from `lib/topics.ts` into `messages/*.json` under
`topicItems.<topic>` with `label`, `shortLabel`, `description`. `lib/topics.ts`
becomes `topicOrder` (typed by `Topic`) plus a `getTopicMeta(t, t)` helper.
All remaining hardcoded UI strings move to messages: not-found, blog/topic
metadata, empty states, radar panel chrome, article metadata labels, search,
filters, counts, pagination, AI notice, breadcrumbs.

### Styling

- New tokens in `globals.css`: `--on-signal` (text on chartreuse),
  `--header-bg` (translucent header), `--prose-body`, `--code-bg`.
- Migrate `[var(--x)]` to `(--x)` in all Tailwind classes; replace loose
  hexes (`#090b0d`, `#0b0d0a`, `#d8ded8`, `#07090b`, `#090b0de6`) with tokens.
- Audit every element on a signal background for dark text and stable hover.

### Content model

- `packages/schemas/post.ts` (exception): add `updatedAt` to
  `postSummarySchema` pick.
- Local indexes: existing summaries lack `updatedAt` until republished; the
  toggle falls back to `publishedAt`. Republishing one post via the local
  dev-publish tool regenerates the summary.
- `sitemap.ts`: `lastModified` uses `updatedAt ?? publishedAt`.

### SEO and sharing

- Dynamic OG per post at `app/[locale]/blog/[slug]/opengraph-image.tsx`:
  title, topic color, brand mark, description.
- Static OG updated with the new mark.
- Sitemap keeps single canonical `/blog`; faceted console states are not
  listed (shareable via URL, crawlable on first render).
- Manual steps outside code (documented in README): Google Search Console
  and Bing Webmaster Tools submission; optional INPI software registration
  and trademark when the project grows.

## Security audit results

- No secrets in tracked files. `.env` and `.env.*` are gitignored except
  `.env.example` (placeholders only).
- Local `web/.env.local` holds MiniStack dummy credentials and a PostHog
  public key (public by design); nothing sensitive.
- AWS SDK (`content.ts`) is only imported by server modules. The client
  console receives data via props and must never import it or read env.
- Production AWS credentials should come from IAM roles, not env files.

## Verification

`yarn lint`, `yarn typecheck`, `yarn build` from the repo root. S3
connectivity errors are expected when MiniStack is down.

## Out of scope

- lambda/, iac/, docker-compose, remaining packages/schemas.
- Full-text search beyond the loaded index (needs an archive index or search
  service in a future pipeline change).
- GitHub publication (later, separate step).
