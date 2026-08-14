# Leads

Lead capture for NexSift and the planned email delivery path.

## Current implementation (shipped)

- Lead modal (`web/src/features/lead/`): `LeadModalProvider` (context, first-visit auto-show after 8s, localStorage flag `nexsift-lead-modal-shown`), `LeadModal` (name, email, optional feedback, honeypot, idle/submitting/success/error states), `LeadModalTrigger` (reopen buttons in header and footer).
- Submissions are captured as the PostHog event `lead_captured` (name, email, feedback, page, locale) via `web/src/analytics/events.ts`.
- Leads currently live only in PostHog (client-side capture, no server-side list). Enough to validate whether the audience responds.
- i18n in pt-BR/en-US/es-ES (`leadModal.*` and `footer.updates.*` message keys); privacy policy updated to cover voluntary name/email/feedback collection.

## Email delivery (planned, blocked on domain)

Decision: ESP (Brevo) + daily digest, at most 1 email per day.

### Blockers

- NexSift has no domain yet. Brevo requires a verified sender domain (SPF, DKIM and DMARC DNS records) for transactional sending; a @gmail.com sender is not accepted. Acquire a domain once leads prove useful.

### Contract additions (when implemented)

- `POST /leads` (public, no Bearer): body `{ name, email, feedback? }` validated with a new `leadSubmissionSchema` (`packages/schemas/lead.ts`); forwards to the Brevo contacts API; 201 on success.
- `GET /leads/unsubscribe?email=...` (public): removes the contact from the list and returns a small HTML confirmation page; linked from every digest footer (LGPD).
- Auth: `/leads*` routes bypass the global Bearer check in `lambda/src/publish/handler.ts`; every other route keeps it.
- Update `docs/openapi.yaml` and `docs/gpt-editor-*.md` when the contract changes.

### Digest mechanics

- Fires from `publishPost` only when `operation === 'created'`; updates and deletes never trigger an email.
- Marker `public/meta/digest-marker.json` in S3: if the current date (timezone `DIGEST_TIMEZONE`, default `America/Sao_Paulo`) matches the marker date, no email is sent. Otherwise one digest is sent with up to 10 signals published that day, then the marker is written.
- Multiple publishes on the same day: the first one triggers the digest with the signals published so far; the rest go into the next day's digest.
- Without `BREVO_API_KEY` (local/MiniStack): no-op with a log entry, same pattern as `captureEvent`.

### Lambda env vars

`SITE_URL`, `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `DIGEST_TIMEZONE`. The API key comes from a terraform variable like `publish_token` (prod tfvars is gitignored).

### Digest email design

- From: `sinais@<domain>` with name "NexSift".
- Subject (pt-BR, no em dash): `NexSift: {n} sinais no radar hoje`.
- Visual follows `docs/design.md` adapted to email: table layout with inline CSS, system fonts (monospace for metadata), dark graphite background, chartreuse accents, no external images in v1 (deliverability), no tracking pixel.
- Structure: brand header ("NEXSIFT · SINAIS DO DIA"), list of signals (topic, title, short description, "Ler sinal" link to `{SITE_URL}/blog/{slug}`), footer with the tagline plus unsubscribe and privacy links.
- Copy in pt-BR, editorial tone, no Unicode em dash.

### Open decisions

- Sender domain and address once acquired.
- Dark vs light email style (dark preferred to match the site).
- Cover thumbnails in the digest (deferred; images require the site origin and affect deliverability).

## Validation phase

Use PostHog (People > Persons) to check whether signups keep coming and engage before investing in a domain and the ESP integration.