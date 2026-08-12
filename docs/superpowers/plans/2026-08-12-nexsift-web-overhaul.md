# NexSift Web Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the NexSift web surface: brand assets (N/ + signal dot), full i18n, blog console (search/filters/counts/ordering/load more), active nav, breadcrumbs, AI notice, expanded landing, dynamic OG, Tailwind v4 syntax, licensing and a security rescan.

**Architecture:** Server components fetch posts from S3 (index) and pass data as props to a client `LedgerConsole` that owns search/filter/sort/load-more state and syncs the URL via `router.replace`. `lib/topics.ts` becomes a translation-backed helper. All UI strings live in `messages/*.json`. One approved exception touches `packages/schemas/post.ts` (add `updatedAt` to the summary pick).

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, next-intl 4, TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), lucide-react, next/og.

## Global Constraints

- Scope: `web/` plus `packages/schemas/post.ts` (one-line exception). Never touch `lambda/`, `iac/`, `docker-compose.yml`, other schema files.
- No commits and no push without explicit user authorization.
- No Unicode em dash (`—`) in any product copy. Use periods, commas, colons, parentheses or a hyphen.
- Code and comments in English. Single quotes. `camelCase` variables, `PascalCase` components/types. Named function declarations. No obvious comments.
- UI strings go in `messages/*.json` (pt-BR, en-US, es-ES). Editorial content stays pt-BR.
- Use design tokens from `web/src/app/globals.css`. New Tailwind classes use v4 variable syntax `bg-(--signal)`, never `[var(--signal)]`.
- `exactOptionalPropertyTypes` is on: never pass explicit `undefined` to an optional prop. Where a prop may be `undefined`, type it as required `T | undefined`.
- New client components must not import `content.ts` or read `process.env` (security rule).
- Verification per task: `yarn workspace @nexsift/web typecheck`. Final: `yarn lint && yarn typecheck && yarn build`. S3 connection errors are expected when MiniStack is down.
- `packages/schemas/topic.ts` and `packages/schemas/post.ts` exports used: `topicSchema`, `Topic`, `PostSummary`.

---

### Task 1: Add updatedAt to the post summary index

**Files:**
- Modify: `packages/schemas/post.ts:30-43` (the `postSummarySchema` pick)

**Interfaces:**
- Produces: `PostSummary` now includes `updatedAt: string | undefined`. All later tasks rely on this.

- [ ] **Step 1: Edit the pick**

In `postSummarySchema`, add `updatedAt: true` right after `publishedAt: true`.

- [ ] **Step 2: Edit sitemap lastmod**

In `web/src/app/sitemap.ts`, change the posts map so `lastModified` uses `new Date(post.updatedAt ?? post.publishedAt)` instead of `new Date(post.publishedAt)`.

- [ ] **Step 3: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors (lambda schema usage stays compatible).

---

### Task 2: Expand messages for all new UI strings

**Files:**
- Rewrite: `web/messages/pt-BR.json`
- Rewrite: `web/messages/en-US.json`
- Rewrite: `web/messages/es-ES.json`

**Interfaces:**
- Produces: the full message tree consumed by every later task. Key namespaces: `topicItems.<topic>.{label,shortLabel,description}`, `notice.{short,article}`, `breadcrumb.{home,blog,topics}`, `console.{searchPlaceholder,allTopics,sortRecent,sortUpdated,loadMore,empty,countLabel}`, `topicPage.{frequency,empty}`, `article.{metadata,published,updated,reading,author,authorValue}`, `radar.{badge,frequencyHeader,scoreHeader}`, `stats.{signals,frequencies,avgRelevance}`, `recentlyUpdated.{eyebrow,title,description}`, `follow.{eyebrow,title,description,rss,archive}`, `notFound.{eyebrow,title,body,back}`, `blog.signalsPublished` (`{count} sinais publicados`), `blog.metaTitle`, `blog.metaDescription`.

- [ ] **Step 1: pt-BR.json**

Keep all existing keys (`nav`, `hero`, `signal`, `latest`, `topics`, `process`, `trust`, `footer`, `about`) with these adjustments: `hero.description`, `latest.description`, `trust.description` changed to the approved copy below. Add the new namespaces below.

```json
{
  "nav": {
    "blog": "Blog",
    "topics": "Tópicos",
    "process": "Como funciona",
    "about": "Sobre",
    "today": "Ver sinais"
  },
  "hero": {
    "eyebrow": "Inteligência tech para desenvolvedores",
    "titleA": "Menos ruído.",
    "titleB": "Mais sinal.",
    "description": "O NexSift é um agregador de conhecimento direto ao ponto. Filtra, verifica e contextualiza o que importa em IA, cloud, desenvolvimento e mercado tech, com cada sinal rastreável até a fonte oficial.",
    "primary": "Ver sinais",
    "secondary": "Entender o processo"
  },
  "signal": {
    "label": "RADAR ATUAL",
    "frequencies": "frequências ativas",
    "selected": "sinais selecionados",
    "verified": "com fontes verificáveis"
  },
  "latest": {
    "eyebrow": "SIGNAL LEDGER",
    "title": "O que merece sua atenção agora",
    "description": "Não é um portal de notícias. É uma seleção curta de sinais com contexto suficiente e fonte verificável."
  },
  "topics": {
    "eyebrow": "FREQUÊNCIAS",
    "title": "Cinco áreas, um único radar",
    "description": "A cobertura é ampla. A seleção continua restrita ao que tem impacto técnico ou profissional real."
  },
  "process": {
    "eyebrow": "PIPELINE",
    "title": "Curadoria antes de publicação",
    "description": "A IA ajuda a pesquisar, organizar e revisar. O conteúdo precisa permanecer rastreável até suas fontes.",
    "research": "Pesquisar",
    "filter": "Filtrar",
    "verify": "Verificar",
    "context": "Contextualizar",
    "publish": "Publicar"
  },
  "trust": {
    "eyebrow": "SOURCE GROUNDED",
    "title": "IA assistida. Fontes visíveis.",
    "description": "Cada análise é direta ao ponto: o que aconteceu, o que mudou e por que importa. O NexSift não substitui a fonte original; aponta para o material que sustenta o conteúdo e separa fato de interpretação."
  },
  "topicItems": {
    "ai": {
      "label": "Inteligência Artificial",
      "shortLabel": "IA",
      "description": "Modelos, agentes, ferramentas e mudanças práticas no ecossistema de IA."
    },
    "aws-cloud": {
      "label": "AWS & Cloud",
      "shortLabel": "CLOUD",
      "description": "Infraestrutura, serviços gerenciados, arquitetura e custos de cloud."
    },
    "development": {
      "label": "Desenvolvimento",
      "shortLabel": "DEV",
      "description": "Frameworks, runtimes, plataformas e práticas de engenharia de software."
    },
    "devops": {
      "label": "DevOps",
      "shortLabel": "OPS",
      "description": "CI/CD, IaC, observabilidade, automação e operação de sistemas."
    },
    "career": {
      "label": "Carreira",
      "shortLabel": "CAREER",
      "description": "Mercado, habilidades, contratação e movimentos que afetam profissionais tech."
    }
  },
  "notice": {
    "short": "Conteúdo gerado com apoio de IA a partir de fontes oficiais. Pode conter erros.",
    "article": "Este texto foi produzido com apoio de IA e é extraído das fontes oficiais citadas abaixo. Antes de tomar decisões, revise as fontes; erros podem ocorrer."
  },
  "breadcrumb": {
    "home": "Home",
    "blog": "Blog",
    "topics": "Tópicos"
  },
  "console": {
    "searchPlaceholder": "Buscar por título, tag ou descrição",
    "allTopics": "Todos",
    "sortRecent": "Recentes",
    "sortUpdated": "Atualizados",
    "loadMore": "Carregar mais sinais",
    "empty": "Nenhum sinal corresponde aos filtros atuais.",
    "countLabel": "sinais no radar"
  },
  "topicPage": {
    "frequency": "FREQUENCY"
  },
  "article": {
    "metadata": "Signal metadata",
    "published": "Publicado",
    "updated": "Atualizado",
    "reading": "Leitura",
    "author": "Autor",
    "authorValue": "NexSift Editorial"
  },
  "radar": {
    "badge": "CURATED / CURRENT",
    "frequencyHeader": "Frequency / signal",
    "scoreHeader": "score"
  },
  "stats": {
    "signals": "sinais publicados",
    "frequencies": "frequências ativas",
    "avgRelevance": "relevância média"
  },
  "recentlyUpdated": {
    "eyebrow": "ATUALIZADOS RECENTEMENTE",
    "title": "Sinais revistos por último",
    "description": "Posts corrigidos ou atualizados com novas fontes e contexto."
  },
  "follow": {
    "eyebrow": "ACOMPANHAR",
    "title": "Menos leitura. Mais sinal.",
    "description": "Assine o feed RSS para receber cada sinal publicado, direto do radar, sem newsletter e sem ruído.",
    "rss": "Assinar RSS",
    "archive": "Ver arquivo completo"
  },
  "notFound": {
    "eyebrow": "404 / NO SIGNAL",
    "title": "Frequência não encontrada.",
    "body": "Este endereço não aponta para um sinal publicado pelo NexSift.",
    "back": "Voltar ao radar"
  },
  "footer": {
    "tagline": "Menos ruído. Mais sinal.",
    "builtBy": "Criado por Tiago Castro",
    "rights": "NexSift"
  },
  "about": {
    "eyebrow": "SOBRE",
    "title": "Um filtro técnico, não mais um feed infinito",
    "body": "O NexSift nasceu para reduzir o custo de acompanhar tecnologia. Em vez de reproduzir tudo que foi publicado, ele prioriza sinais com impacto real para quem constrói software, trabalha com cloud ou acompanha a evolução da IA.",
    "principleTitle": "Princípios editoriais",
    "principleA": "Fonte antes de opinião",
    "principleB": "Contexto antes de volume",
    "principleC": "Impacto técnico antes de hype"
  },
  "blog": {
    "eyebrow": "ARQUIVO",
    "title": "Sinais e análises",
    "description": "Conteúdo editorial publicado em português, ordenado por relevância e recência.",
    "read": "Ler análise",
    "why": "Por que isso importa",
    "sources": "Fontes",
    "related": "Sinais relacionados",
    "minutes": "min de leitura",
    "score": "relevância",
    "signalsPublished": "{count} sinais publicados",
    "metaTitle": "Blog",
    "metaDescription": "Sinais e análises técnicas do NexSift em português."
  }
}
```

- [ ] **Step 2: en-US.json**

Same structure as pt-BR. `hero.description`: "NexSift is a knowledge aggregator that gets straight to the point. It filters, verifies and contextualizes what matters across AI, cloud, development and tech careers, with every signal traceable to its official source." `latest.description`: "Not a news portal. A short selection of signals with enough context and a traceable source." `trust.description`: "Each analysis gets straight to the point: what happened, what changed and why it matters. NexSift does not replace the original source; it points to the material that supports the content and separates facts from interpretation."

`topicItems`: ai "Artificial Intelligence" / "AI"; aws-cloud "AWS & Cloud" / "CLOUD" / "Managed infrastructure, services, architecture and cloud costs."; development "Development" / "DEV" / "Frameworks, runtimes, platforms and software engineering practices."; devops "DevOps" / "OPS" / "CI/CD, IaC, observability, automation and systems operation."; career "Career" / "CAREER" / "Market, skills, hiring and moves that affect tech professionals."

`notice.short`: "Content produced with AI support from official sources. Errors may occur." `notice.article`: "This text was produced with AI support and is extracted from the official sources cited below. Review the sources before making decisions; errors may occur."

`breadcrumb`: "Home" / "Blog" / "Topics". `console`: "Search by title, tag or description" / "All" / "Recent" / "Updated" / "Load more signals" / "No signals match the current filters." / "signals on the radar". `topicPage`: "FREQUENCY" / "No signals published on this frequency yet."

`article`: "Signal metadata" / "Published" / "Updated" / "Reading" / "Author" / "NexSift Editorial". `radar`: "CURATED / CURRENT" / "Frequency / signal" / "score". `stats`: "signals published" / "active frequencies" / "average relevance". `recentlyUpdated`: "RECENTLY UPDATED" / "Signals reviewed last" / "Posts corrected or updated with new sources and context." `follow`: "FOLLOW" / "Less reading. More signal." / "Subscribe to the RSS feed to get every published signal straight from the radar, no newsletter and no noise." / "Subscribe to RSS" / "View full archive". `notFound`: "404 / NO SIGNAL" / "Frequency not found." / "This address does not point to a signal published by NexSift." / "Back to the radar".

`blog.signalsPublished`: "{count} signals published", `blog.metaTitle`: "Blog", `blog.metaDescription`: "NexSift technical signals and analysis in Portuguese."

- [ ] **Step 3: es-ES.json**

Same structure. `hero.description`: "NexSift es un agregador de conocimiento directo al grano. Filtra, verifica y contextualiza lo que importa en IA, cloud, desarrollo y carrera tech, con cada señal vinculada a su fuente oficial." `latest.description`: "No es un portal de noticias. Es una selección corta de señales con contexto suficiente y fuente rastreable." `trust.description`: "Cada análisis va directo al grano: qué pasó, qué cambió y por qué importa. NexSift no sustituye la fuente original; señala el material que sustenta el contenido y separa hechos de interpretación."

`topicItems`: ai "Inteligencia Artificial" / "IA"; aws-cloud "AWS & Cloud" / "CLOUD" / "Infraestructura, servicios gestionados, arquitectura y costos de cloud."; development "Desarrollo" / "DEV" / "Frameworks, runtimes, plataformas y prácticas de ingeniería de software."; devops "DevOps" / "OPS" / "CI/CD, IaC, observabilidad, automatización y operación de sistemas."; career "Carrera" / "CAREER" / "Mercado, habilidades, contratación y movimientos que afectan a profesionales tech."

`notice.short`: "Contenido generado con apoyo de IA a partir de fuentes oficiales. Puede contener errores." `notice.article`: "Este texto se produjo con apoyo de IA y se extrae de las fuentes oficiales citadas. Revisa las fuentes antes de tomar decisiones; pueden ocurrir errores."

`breadcrumb`: "Inicio" / "Blog" / "Temas". `console`: "Buscar por título, etiqueta o descripción" / "Todos" / "Recientes" / "Actualizados" / "Cargar más señales" / "Ninguna señal coincide con los filtros actuales." / "señales en el radar". `topicPage`: "FRECUENCIA" / "Aún no hay señales publicadas en esta frecuencia."

`article`: "Signal metadata" / "Publicado" / "Actualizado" / "Lectura" / "Autor" / "NexSift Editorial". `radar`: "CURATED / CURRENT" / "Frequency / signal" / "score". `stats`: "señales publicadas" / "frecuencias activas" / "relevancia media". `recentlyUpdated`: "ACTUALIZADOS RECIENTEMENTE" / "Señales revisadas por último" / "Publicaciones corregidas o actualizadas con nuevas fuentes y contexto." `follow`: "SEGUIR" / "Menos lectura. Más señal." / "Suscríbete al feed RSS para recibir cada señal publicada directamente desde el radar, sin newsletter y sin ruido." / "Suscribirse al RSS" / "Ver archivo completo". `notFound`: "404 / NO SIGNAL" / "Frecuencia no encontrada." / "Esta dirección no apunta a una señal publicada por NexSift." / "Volver al radar".

`blog.signalsPublished`: "{count} señales publicadas", `blog.metaTitle`: "Blog", `blog.metaDescription`: "Señales y análisis técnicos de NexSift en portugués."

- [ ] **Step 4: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors (message types are inferred from JSON).

---

### Task 3: Refactor topics into a translation-backed helper

**Files:**
- Rewrite: `web/src/lib/topics.ts`
- Modify: `web/src/lib/date.ts` (add comparator)
- Modify: `web/src/features/blog/signal-ledger.tsx` (server, internal translations, use new `LedgerRow`)
- Modify: `web/src/features/landing/radar-panel.tsx` (server, internal translations, no props)
- Modify: `web/src/features/landing/topic-bands.tsx` (server, internal translations)
- Modify: `web/src/app/sitemap.ts` (use `topicOrder`)
- Create: `web/src/features/blog/ledger-row.tsx` (pure presentational row shared by server ledger and client console)

**Interfaces:**
- Produces: `topicOrder: readonly Topic[]`; `TopicMeta { label; shortLabel; description }`; `getTopicMeta(t: Translator, topic: Topic): TopicMeta`; `LedgerRow({ post, index, shortLabel })` where `shortLabel: string | undefined` (required type, `exactOptionalPropertyTypes` safe); `SignalLedger({ posts, limit? })` stays a server component with the same call signature used by pages.

- [ ] **Step 1: Rewrite `web/src/lib/topics.ts`**

```ts
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import type { getTranslations } from 'next-intl/server'

export const topicOrder: readonly Topic[] = [
  'ai',
  'aws-cloud',
  'development',
  'devops',
  'career',
] as const

export interface TopicMeta {
  label: string
  shortLabel: string
  description: string
}

type Translator = Awaited<ReturnType<typeof getTranslations>>

export function getTopicMeta(t: Translator, topic: Topic): TopicMeta {
  switch (topic) {
    case 'ai':
      return {
        label: t('topicItems.ai.label'),
        shortLabel: t('topicItems.ai.shortLabel'),
        description: t('topicItems.ai.description'),
      }
    case 'aws-cloud':
      return {
        label: t('topicItems.aws-cloud.label'),
        shortLabel: t('topicItems.aws-cloud.shortLabel'),
        description: t('topicItems.aws-cloud.description'),
      }
    case 'development':
      return {
        label: t('topicItems.development.label'),
        shortLabel: t('topicItems.development.shortLabel'),
        description: t('topicItems.development.description'),
      }
    case 'devops':
      return {
        label: t('topicItems.devops.label'),
        shortLabel: t('topicItems.devops.shortLabel'),
        description: t('topicItems.devops.description'),
      }
    case 'career':
      return {
        label: t('topicItems.career.label'),
        shortLabel: t('topicItems.career.shortLabel'),
        description: t('topicItems.career.description'),
      }
  }
}
```

`topicSchema` is imported to keep the file coupled to the schema source of truth (used below in Task 9's topic validation via direct import from schemas; keep this import if the linter flags it as unused, otherwise drop it and import only `Topic`).

- [ ] **Step 2: Add comparator to `web/src/lib/date.ts`**

```ts
import type { PostSummary } from '@nexsift/schemas/post'

export function postLatestUpdate(
  post: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
): string {
  return post.updatedAt ?? post.publishedAt
}

export function compareByLatestUpdate(
  first: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
  second: Pick<PostSummary, 'updatedAt' | 'publishedAt'>,
): number {
  return (
    new Date(postLatestUpdate(second)).getTime() -
    new Date(postLatestUpdate(first)).getTime()
  )
}
```

Keep the existing `formatDate` and `formatCompactDate` exports unchanged.

- [ ] **Step 3: Create `web/src/features/blog/ledger-row.tsx`**

```tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { PostSummary } from '@nexsift/schemas/post'
import { formatCompactDate } from '@/lib/date'

export function LedgerRow({
  post,
  index,
  shortLabel,
}: {
  post: PostSummary
  index: number
  shortLabel: string | undefined
}) {
  const topic = post.topics[0]

  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      data-topic={topic}
      className="signal-ledger-row topic-color"
    >
      <span className="font-mono text-[11px] text-(--muted)">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="signal-ledger-topic flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-(--topic-color)">
        <span className="h-px w-4 bg-(--topic-color)" />
        {shortLabel ?? 'SIGNAL'}
      </span>
      <div className="signal-title min-w-0 py-4">
        <h3 className="text-[clamp(1rem,1.4vw,1.22rem)] font-medium leading-snug tracking-[-0.025em] text-(--foreground)">
          {post.title}
        </h3>
        <p className="mt-1.5 hidden max-w-3xl text-sm leading-relaxed text-(--muted) md:block">
          {post.description}
        </p>
      </div>
      <div className="flex items-center gap-3 pl-2">
        <div className="hidden text-right sm:block">
          <div className="font-mono text-xs font-semibold text-(--foreground)">
            {post.relevanceScore.toFixed(1)}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-(--muted)">
            {formatCompactDate(post.publishedAt)}
          </div>
        </div>
        <ArrowUpRight size={15} className="text-(--muted)" strokeWidth={1.7} />
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Rewrite `web/src/features/blog/signal-ledger.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import type { PostSummary } from '@nexsift/schemas/post'
import { getTopicMeta } from '@/lib/topics'
import { LedgerRow } from './ledger-row'

export async function SignalLedger({
  posts,
  limit,
}: {
  posts: PostSummary[]
  limit?: number
}) {
  const t = await getTranslations()
  const visiblePosts = typeof limit === 'number' ? posts.slice(0, limit) : posts

  return (
    <div>
      {visiblePosts.map((post, index) => {
        const topic = post.topics[0]
        const shortLabel = topic ? getTopicMeta(t, topic).shortLabel : undefined

        return (
          <LedgerRow key={post.slug} post={post} index={index} shortLabel={shortLabel} />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Rewrite `web/src/features/landing/radar-panel.tsx`**

Server component, no props, internal translations:

```tsx
import { getTranslations } from 'next-intl/server'
import type { PostSummary } from '@nexsift/schemas/post'
import { getTopicMeta } from '@/lib/topics'

export async function RadarPanel({ posts }: { posts: PostSummary[] }) {
  const t = await getTranslations()
  const topSignals = posts.slice(0, 5)
  const frequencyCount = new Set(posts.flatMap((post) => post.topics)).size
  const verifiedPercentage = posts.length > 0 ? '100%' : '0%'

  return (
    <div className="relative overflow-hidden border border-(--border) bg-(--surface-soft)">
      <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="signal-dot" />
          <span className="eyebrow text-(--foreground)">{t('signal.label')}</span>
        </div>
        <span className="font-mono text-[10px] text-(--muted)">{t('radar.badge')}</span>
      </div>

      <div className="grid grid-cols-3 border-b border-(--border)">
        <Metric value={String(frequencyCount)} label={t('signal.frequencies')} />
        <Metric value={String(topSignals.length)} label={t('signal.selected')} />
        <Metric value={verifiedPercentage} label={t('signal.verified')} />
      </div>

      <div className="p-5">
        <div className="mb-3 grid grid-cols-[1fr_auto] font-mono text-[9px] uppercase tracking-[0.1em] text-(--muted)">
          <span>{t('radar.frequencyHeader')}</span>
          <span>{t('radar.scoreHeader')}</span>
        </div>
        <div className="space-y-2">
          {topSignals.map((post) => {
            const topic = post.topics[0]
            if (!topic) {
              return null
            }

            return (
              <div
                key={post.slug}
                data-topic={topic}
                className="topic-color grid grid-cols-[6rem_1fr_auto] items-center gap-3 border-t border-(--border) py-3"
              >
                <span className="font-mono text-[10px] font-semibold text-(--topic-color)">
                  {getTopicMeta(t, topic).shortLabel}
                </span>
                <span className="truncate text-xs text-(--muted-strong)">
                  {post.title}
                </span>
                <span className="font-mono text-xs font-bold text-(--foreground)">
                  {post.relevanceScore.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 grid-line opacity-[0.09]" />
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 border-r border-(--border) p-4 last:border-r-0">
      <div className="font-mono text-xl font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-(--muted)">{label}</div>
    </div>
  )
}
```

- [ ] **Step 6: Rewrite `web/src/features/landing/topic-bands.tsx`**

```tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getTopicMeta, topicOrder } from '@/lib/topics'

export async function TopicBands() {
  const t = await getTranslations()

  return (
    <div className="border-y border-(--border)">
      {topicOrder.map((topic, index) => {
        const meta = getTopicMeta(t, topic)

        return (
          <Link
            key={topic}
            href={`/topics/${topic}`}
            data-topic={topic}
            className="topic-color group grid min-h-24 grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-(--border) last:border-b-0 md:grid-cols-[5rem_0.8fr_2fr_auto]"
          >
            <span className="font-mono text-[10px] text-(--muted)">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-lg font-medium tracking-[-0.03em] text-(--topic-color)">
              {meta.label}
            </span>
            <span className="hidden max-w-2xl text-sm text-(--muted) md:block">
              {meta.description}
            </span>
            <span className="grid size-8 place-items-center text-(--muted) transition-colors group-hover:text-(--topic-color)">
              <ArrowUpRight size={16} />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7: Update `web/src/app/sitemap.ts`**

Replace `import { topicMeta } from '@/lib/topics'` with `import { topicOrder } from '@/lib/topics'`, and `...Object.keys(topicMeta).map((topic) => ...)` with `...topicOrder.map((topic) => ...)`. Keep the rest unchanged (Task 1 already handled `updatedAt`).

- [ ] **Step 8: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 4: Design tokens and base CSS

**Files:**
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Produces: tokens `--on-signal`, `--header-bg`, `--prose-body`, `--code-bg`, `--signal-glow` used by Tasks 5-12.

- [ ] **Step 1: Add tokens**

In the `:root` block of `globals.css`, right after `--danger: #ff7979;`, add:

```css
  --on-signal: #0b0d0a;
  --header-bg: rgba(9, 11, 13, 0.9);
  --prose-body: #d8ded8;
  --code-bg: #07090b;
  --signal-glow: #c7f66b80;
```

- [ ] **Step 2: Use the new tokens in existing CSS**

- `.signal-dot` box-shadow: `0 0 18px #c7f66b80` becomes `0 0 18px var(--signal-glow)`.
- `.prose-nexsift` `color: #d8ded8;` becomes `color: var(--prose-body);`.
- `.prose-nexsift pre` `background: #07090b;` becomes `background: var(--code-bg);`.

- [ ] **Step 3: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 5: Logo assets (SVG mark, favicon, apple icon, static OG)

**Files:**
- Create: `web/src/components/logo-mark.tsx`
- Modify: `web/src/components/brand.tsx`
- Create: `web/src/app/icon.svg`
- Create: `web/src/app/apple-icon.tsx`
- Modify: `web/src/app/opengraph-image.tsx`

**Interfaces:**
- Produces: `LogoMark({ size? }: { size?: number })` (default 28). `Brand({ locale })` unchanged signature. Favicon at `/icon.svg`, apple touch icon at `/apple-icon.png` (auto-discovered by Next).

- [ ] **Step 1: Create `web/src/components/logo-mark.tsx`**

```tsx
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="4"
        fill="var(--surface)"
        stroke="var(--border-strong)"
      />
      <text
        x="5.5"
        y="18.5"
        fill="var(--signal)"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fontSize="12.5"
        fontWeight="700"
        letterSpacing="-1.5"
      >
        N/
      </text>
      <circle cx="22" cy="6.5" r="2" fill="var(--signal)" />
    </svg>
  )
}
```

- [ ] **Step 2: Update `web/src/components/brand.tsx`**

Replace the inline `span` mark with `LogoMark`; drop the now-unused classes. Result:

```tsx
import Link from 'next/link'
import { LogoMark } from './logo-mark'

export function Brand({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="group flex items-center gap-3"
      aria-label="NexSift"
    >
      <LogoMark />
      <span className="text-[0.95rem] font-semibold tracking-[-0.03em]">NexSift</span>
    </Link>
  )
}
```

- [ ] **Step 3: Create `web/src/app/icon.svg`**

Standalone SVG (literal hex, no CSS vars; favicon has no page context):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="7" fill="#101418" stroke="#354239" stroke-width="2"/>
  <text x="7" y="22" fill="#c7f66b" font-family="ui-monospace, monospace" font-size="15" font-weight="700" letter-spacing="-1">N/</text>
  <circle cx="25" cy="7" r="2.6" fill="#c7f66b"/>
</svg>
```

- [ ] **Step 4: Create `web/src/app/apple-icon.tsx`**

Div-based mark (satori does not render `svg` reliably):

```tsx
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090b0d',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 26,
          border: '3px solid #354239',
          background: '#101418',
        }}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: '-6px',
            color: '#c7f66b',
          }}
        >
          N/
        </span>
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: '#c7f66b',
          }}
        />
      </div>
    </div>,
    size,
  )
}
```

- [ ] **Step 5: Update `web/src/app/opengraph-image.tsx`**

Keep the existing layout (brand row / tagline / topics line), but replace the plain 14px dot in the brand row with the div-based mark (smaller, 28px, same style as apple icon). Keep the hardcoded pt-BR tagline and topic list (brand asset, intentionally locale-neutral here).

- [ ] **Step 6: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 6: Active nav links

**Files:**
- Create: `web/src/components/nav-links.tsx` (client)
- Modify: `web/src/components/header.tsx`

**Interfaces:**
- Produces: `NavLinks({ locale, labels }: { locale: string; labels: { blog: string; topics: string; process: string; about: string } })`. Uses `usePathname`, renders the nav with active dots.

- [ ] **Step 1: Create `web/src/components/nav-links.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { topicSchema, type Topic } from '@nexsift/schemas/topic'

interface NavLabels {
  blog: string
  topics: string
  process: string
  about: string
}

function topicFromPath(pathname: string): Topic | null {
  const match = pathname.match(/^\/topics\/([a-z-]+)$/)

  if (!match) {
    return null
  }

  const result = topicSchema.safeParse(match[1])

  return result.success ? result.data : null
}

export function NavLinks({
  locale,
  labels,
}: {
  locale: string
  labels: NavLabels
}) {
  const pathname = usePathname()
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/')
  const isAbout = pathname === '/about' || pathname.startsWith('/about/')
  const isTopics = pathname.startsWith('/topics/')
  const activeTopic = topicFromPath(pathname)

  const linkClass = 'flex items-center gap-2 transition-colors hover:text-white'
  const activeClass = 'text-(--foreground)'
  const inactiveClass = 'text-(--muted-strong)'

  return (
    <nav className="hidden items-center gap-7 text-sm lg:flex">
      <Link
        href="/blog"
        className={`${linkClass} ${isBlog ? activeClass : inactiveClass}`}
      >
        {isBlog ? <ActiveDot topic={activeTopic} /> : null}
        {labels.blog}
      </Link>
      <Link
        href={`/${locale}#topics`}
        className={`${linkClass} ${isTopics ? activeClass : inactiveClass}`}
      >
        {isTopics ? <ActiveDot topic={activeTopic} /> : null}
        {labels.topics}
      </Link>
      <Link
        href={`/${locale}#process`}
        className={`${linkClass} ${inactiveClass}`}
      >
        {labels.process}
      </Link>
      <Link
        href={`/${locale}/about`}
        className={`${linkClass} ${isAbout ? activeClass : inactiveClass}`}
      >
        {isAbout ? <ActiveDot /> : null}
        {labels.about}
      </Link>
    </nav>
  )
}

function ActiveDot({ topic }: { topic?: Topic }) {
  if (topic) {
    return (
      <span
        data-topic={topic}
        className="topic-color size-1.5 rounded-full bg-(--topic-color)"
      />
    )
  }

  return <span className="size-1.5 rounded-full bg-(--signal)" />
}
```

- [ ] **Step 2: Update `web/src/components/header.tsx`**

Remove the inline `nav` block and the `Link` import if no longer used (keep `ArrowUpRight`, `AppLocale`, `Brand`, `LocaleSwitcher`). Render `<NavLinks locale={locale} labels={labels} />` in its place. The `today` CTA and the rest of the header stay unchanged.

- [ ] **Step 3: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 7: Breadcrumbs and article overhaul

**Files:**
- Create: `web/src/features/blog/breadcrumbs.tsx` (server)
- Rewrite: `web/src/features/blog/post-article.tsx` (server, no labels prop, breadcrumb, updated metadata, AI notice)
- Modify: `web/src/app/[locale]/blog/[slug]/page.tsx`

**Interfaces:**
- Produces: `Breadcrumbs({ items, topic }: { items: { label: string; href?: string }[]; topic: Topic | undefined })` (`topic` is required-with-undefined so callers can pass `primaryTopic: Topic | undefined` under `exactOptionalPropertyTypes`). `PostArticle({ post })` (labels prop removed; `blog/[slug]/page.tsx` stops passing labels).

- [ ] **Step 1: Create `web/src/features/blog/breadcrumbs.tsx`**

```tsx
import Link from 'next/link'
import type { Topic } from '@nexsift/schemas/topic'

export function Breadcrumbs({
  items,
  topic,
}: {
  items: { label: string; href?: string }[]
  topic: Topic | undefined
}) {
  return (
    <nav
      data-topic={topic}
      className="topic-color mb-7 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-(--muted)"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const label = item.href ? (
          <Link
            href={item.href}
            className="transition-colors hover:text-(--foreground)"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={`max-w-[16rem] truncate ${
              topic ? 'text-(--topic-color)' : 'text-(--foreground)'
            }`}
          >
            {item.label}
          </span>
        )

        return (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-(--muted)">/</span> : null}
            {label}
          </span>
        )
      })}
    </nav>
  )
}
```

Note: `--topic-color` is only set by the `topic-color` class for known topics, so the last crumb only uses it when `topic` is provided.

- [ ] **Step 2: Rewrite `web/src/features/blog/post-article.tsx`**

```tsx
import { ArrowUpRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getTranslations } from 'next-intl/server'
import type { Post } from '@nexsift/schemas/post'
import { TrackedLink } from '@/analytics/tracked-link'
import { formatDate } from '@/lib/date'
import { getTopicMeta } from '@/lib/topics'
import { Breadcrumbs } from './breadcrumbs'

export async function PostArticle({ post }: { post: Post }) {
  const t = await getTranslations()
  const primaryTopic = post.topics[0]
  const topicLabel = primaryTopic ? getTopicMeta(t, primaryTopic).label : null
  const breadcrumbs = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.blog'), href: '/blog' },
  ]
  const topicCrumb = primaryTopic
    ? { label: topicLabel ?? '', href: `/topics/${primaryTopic}` }
    : null

  return (
    <article className="page-shell py-12 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[13rem_minmax(0,48rem)_minmax(13rem,1fr)] lg:gap-12 xl:gap-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Breadcrumbs
            items={[...breadcrumbs, ...(topicCrumb ? [topicCrumb] : []), { label: post.title }]}
            topic={primaryTopic}
          />
          <div className="border-t border-(--border) pt-4">
            <div className="eyebrow">{t('article.metadata')}</div>
            <dl className="mt-5 space-y-5 font-mono text-[10px] uppercase tracking-[0.08em]">
              <Meta label={t('article.published')} value={formatDate(post.publishedAt)} />
              {post.updatedAt ? (
                <Meta label={t('article.updated')} value={formatDate(post.updatedAt)} />
              ) : null}
              <Meta label={t('article.reading')} value={`${post.readingTime} ${t('blog.minutes')}`} />
              <Meta label={t('blog.score')} value={`${post.relevanceScore.toFixed(1)} / 10`} />
              <Meta label={t('article.author')} value={t('article.authorValue')} />
            </dl>
          </div>
          <p className="mt-8 border-t border-(--border) pt-4 font-mono text-[10px] leading-relaxed text-(--muted)">
            {t('notice.article')}
          </p>
        </aside>

        <div className="min-w-0">
          {primaryTopic && topicLabel ? (
            <div
              data-topic={primaryTopic}
              className="topic-color mb-7 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-(--topic-color)"
            >
              <span className="h-px w-6 bg-(--topic-color)" />
              {topicLabel}
            </div>
          ) : null}

          <h1 className="max-w-4xl text-[clamp(2.5rem,6vw,5.3rem)] font-medium leading-[0.96] tracking-[-0.065em]">
            {post.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-(--muted-strong) md:text-xl">
            {post.description}
          </p>

          <div className="my-10 h-px bg-(--border)" />

          <div className="prose-nexsift">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          <section className="mt-14 border border-(--border) bg-(--signal-soft) p-6 md:p-8">
            <div className="eyebrow text-(--signal)">{t('blog.why')}</div>
            <p className="mt-4 text-lg leading-relaxed text-(--foreground)">
              {post.whyItMatters}
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-t border-(--border) pt-4">
            <div className="eyebrow">{t('blog.sources')}</div>
            <div className="mt-5 space-y-3">
              {post.sources.map((source, index) => (
                <TrackedLink
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  event="source_clicked"
                  properties={{ post: post.slug, publisher: source.publisher }}
                  className="group block border-b border-(--border) pb-3"
                >
                  <div className="flex gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-(--muted)">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{source.publisher}</span>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm leading-snug text-(--muted-strong) transition-colors group-hover:text-(--foreground)">
                    <span>{source.title}</span>
                    <ArrowUpRight size={13} className="mt-0.5 shrink-0" />
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-(--muted)">{label}</dt>
      <dd className="mt-1 normal-case tracking-normal text-(--muted-strong)">{value}</dd>
    </div>
  )
}
```

- [ ] **Step 3: Update `web/src/app/[locale]/blog/[slug]/page.tsx`**

Remove the `labels` object from the `<PostArticle>` call: render `<PostArticle post={post} />`. Keep `generateMetadata` and JSON-LD unchanged. The `t` variable is still used by Header and Footer.

- [ ] **Step 4: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 8: Footer notice and landing expansion

**Files:**
- Modify: `web/src/components/footer.tsx` (internal translations for `notice.short`)
- Modify: `web/src/app/[locale]/page.tsx` (radar/topic-bands prop removal, stats band, recently updated, follow section)
- Create: `web/src/features/landing/stats-band.tsx`
- Create: `web/src/features/landing/follow-section.tsx`

**Interfaces:**
- Produces: `StatsBand({ signals, frequencies, avgRelevance, labels })`; `FollowSection()` server component; `Footer({ locale, tagline, builtBy })` unchanged signature.

- [ ] **Step 1: Update `web/src/components/footer.tsx`**

Make it async, call `const t = await getTranslations()` and render below the existing grid, inside the footer element:

```tsx
      <div className="page-shell mt-8 border-t border-(--border) pt-4">
        <p className="font-mono text-[10px] leading-relaxed text-(--muted)">
          {t('notice.short')}
        </p>
      </div>
```

- [ ] **Step 2: Create `web/src/features/landing/stats-band.tsx`**

```tsx
export function StatsBand({
  signals,
  frequencies,
  avgRelevance,
  labels,
}: {
  signals: number
  frequencies: number
  avgRelevance: string
  labels: { signals: string; frequencies: string; avgRelevance: string }
}) {
  return (
    <div className="grid grid-cols-3 border-y border-(--border)">
      <Stat value={String(signals)} label={labels.signals} />
      <Stat value={String(frequencies)} label={labels.frequencies} />
      <Stat value={avgRelevance} label={labels.avgRelevance} />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-(--border) px-6 py-8 last:border-r-0">
      <div className="font-mono text-3xl font-semibold tracking-[-0.05em] text-(--foreground)">
        {value}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-(--muted)">{label}</div>
    </div>
  )
}
```

- [ ] **Step 3: Create `web/src/features/landing/follow-section.tsx`**

```tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function FollowSection() {
  const t = await getTranslations('follow')

  return (
    <section className="border-t border-(--border) bg-(--surface)">
      <div className="page-shell grid gap-8 py-20 lg:grid-cols-[0.65fr_1.35fr] lg:py-28">
        <div>
          <div className="eyebrow">{t('eyebrow')}</div>
          <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
            {t('title')}
          </h2>
        </div>
        <div className="max-w-2xl">
          <p className="text-lg leading-relaxed text-(--muted-strong)">{t('description')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/feed.xml"
              className="flex items-center gap-2 rounded-(--radius-sm) bg-(--signal) px-4 py-2.5 text-sm font-semibold text-(--on-signal) transition-transform hover:-translate-y-0.5"
            >
              {t('rss')}
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-(--muted-strong) hover:text-white"
            >
              {t('archive')}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Update `web/src/app/[locale]/page.tsx`**

- `<RadarPanel posts={posts} labels={{...}} />` becomes `<RadarPanel posts={posts} />` (radar fetches its own labels now).
- `<TopicBands />` stays (now async server component, called the same way).
- After the `#signals` section, add a recently updated section:

```tsx
        <section className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="eyebrow">{t('recentlyUpdated.eyebrow')}</div>
              <h2 className="mt-4 max-w-md text-4xl font-medium tracking-[-0.055em] md:text-5xl">
                {t('recentlyUpdated.title')}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-(--muted)">
                {t('recentlyUpdated.description')}
              </p>
            </div>
            <SignalLedger posts={[...posts].sort(compareByLatestUpdate).slice(0, 5)} />
          </div>
        </section>
```

- After the `#process` section and before the trust section, add:

```tsx
        <section className="page-shell py-20 lg:py-28">
          <StatsBand
            signals={posts.length}
            frequencies={new Set(posts.flatMap((post) => post.topics)).size}
            avgRelevance={
              posts.length > 0
                ? (
                    posts.reduce((sum, post) => sum + post.relevanceScore, 0) /
                    posts.length
                  ).toFixed(1)
                : '0.0'
            }
            labels={{
              signals: t('stats.signals'),
              frequencies: t('stats.frequencies'),
              avgRelevance: t('stats.avgRelevance'),
            }}
          />
        </section>
```

- After the trust section, add `<FollowSection />` before the closing `</main>`.
- Update imports: add `StatsBand`, `FollowSection`, and `compareByLatestUpdate` from `@/lib/date`.

- [ ] **Step 5: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 9: Blog console (search, chips, counts, ordering, load more)

**Files:**
- Create: `web/src/features/blog/order-toggle.tsx` (client)
- Create: `web/src/features/blog/ledger-console.tsx` (client)
- Rewrite: `web/src/app/[locale]/blog/page.tsx`
- Rewrite: `web/src/app/[locale]/topics/[topic]/page.tsx`

**Interfaces:**
- Produces: `SortOrder = 'recent' | 'updated'` (exported from `order-toggle.tsx`); `OrderToggle({ value, onChange, labels }: { value: SortOrder; onChange: (value: SortOrder) => void; labels: { recent: string; updated: string } })`; `LedgerConsole({ posts, fixedTopic, labels, topicMeta, initialTopic, initialQuery, initialSort, pageSize })` where `fixedTopic: Topic | undefined`, `initialTopic: Topic | undefined`, `initialQuery: string | undefined`, `initialSort: SortOrder | undefined`, `pageSize?: number` (all optional-looking props are required with `| undefined` for `exactOptionalPropertyTypes`).

- [ ] **Step 1: Create `web/src/features/blog/order-toggle.tsx`**

```tsx
'use client'

export type SortOrder = 'recent' | 'updated'

export function OrderToggle({
  value,
  onChange,
  labels,
}: {
  value: SortOrder
  onChange: (value: SortOrder) => void
  labels: { recent: string; updated: string }
}) {
  const options: { key: SortOrder; label: string }[] = [
    { key: 'recent', label: labels.recent },
    { key: 'updated', label: labels.updated },
  ]

  return (
    <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em]">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-(--radius-sm) px-2.5 py-1.5 transition-colors ${
            value === option.key
              ? 'bg-(--signal) text-(--on-signal)'
              : 'text-(--muted) hover:text-(--foreground)'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `web/src/features/blog/ledger-console.tsx`**

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PostSummary } from '@nexsift/schemas/post'
import type { Topic } from '@nexsift/schemas/topic'
import { topicOrder } from '@/lib/topics'
import { compareByLatestUpdate } from '@/lib/date'
import { LedgerRow } from './ledger-row'
import { OrderToggle, type SortOrder } from './order-toggle'

interface TopicMeta {
  label: string
  shortLabel: string
}

interface ConsoleLabels {
  searchPlaceholder: string
  allTopics: string
  sortRecent: string
  sortUpdated: string
  loadMore: string
  empty: string
  countLabel: string
}

interface LedgerConsoleProps {
  posts: PostSummary[]
  fixedTopic: Topic | undefined
  labels: ConsoleLabels
  topicMeta: Record<Topic, TopicMeta>
  initialTopic: Topic | undefined
  initialQuery: string | undefined
  initialSort: SortOrder | undefined
  pageSize?: number
}

export function LedgerConsole({
  posts,
  fixedTopic,
  labels,
  topicMeta,
  initialTopic,
  initialQuery,
  initialSort,
  pageSize = 20,
}: LedgerConsoleProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery ?? '')
  const [topic, setTopic] = useState<Topic | null>(fixedTopic ?? initialTopic ?? null)
  const [sort, setSort] = useState<SortOrder>(initialSort ?? 'recent')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const stateRef = useRef({ query, topic, sort })
  stateRef.current = { query, topic, sort }

  useEffect(() => {
    setVisibleCount(pageSize)
  }, [query, topic, sort, pageSize])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const { query: currentQuery, topic: currentTopic, sort: currentSort } = stateRef.current
      const params = new URLSearchParams()

      if (currentQuery) {
        params.set('q', currentQuery)
      }

      if (!fixedTopic && currentTopic) {
        params.set('topic', currentTopic)
      }

      if (currentSort !== 'recent') {
        params.set('sort', currentSort)
      }

      const basePath = fixedTopic ? `/topics/${fixedTopic}` : '/blog'
      const queryString = params.toString()

      router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
        scroll: false,
      })
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [query, topic, sort, router, fixedTopic])

  const counts = useMemo(() => {
    const result = {} as Record<Topic, number>

    for (const post of posts) {
      for (const postTopic of post.topics) {
        result[postTopic] = (result[postTopic] ?? 0) + 1
      }
    }

    return result
  }, [posts])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts
      .filter((post) => {
        if (topic && !post.topics.includes(topic)) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const haystack = `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase()

        return haystack.includes(normalizedQuery)
      })
      .sort((first, second) =>
        sort === 'updated'
          ? compareByLatestUpdate(first, second)
          : new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime(),
      )
  }, [posts, query, topic, sort])

  const visiblePosts = filtered.slice(0, visibleCount)

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-(--border) pb-6 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full max-w-sm border border-(--border) bg-(--surface) px-3 py-2 font-mono text-xs text-(--foreground) outline-none transition-colors placeholder:text-(--muted) focus:border-(--signal) md:w-auto"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted)">
          {filtered.length} {labels.countLabel}
        </span>
      </div>

      {!fixedTopic ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border) py-4">
          <button
            type="button"
            onClick={() => setTopic(null)}
            className={`rounded-(--radius-sm) px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              topic === null
                ? 'bg-(--signal) text-(--on-signal)'
                : 'text-(--muted) hover:text-(--foreground)'
            }`}
          >
            {labels.allTopics}
          </button>
          {topicOrder.map((topicKey) => (
            <button
              key={topicKey}
              type="button"
              data-topic={topicKey}
              onClick={() => setTopic(topic === topicKey ? null : topicKey)}
              className={`topic-color rounded-(--radius-sm) px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                topic === topicKey
                  ? 'bg-(--topic-color) text-(--on-signal)'
                  : 'text-(--muted) hover:text-(--topic-color)'
              }`}
            >
              {topicMeta[topicKey].shortLabel} {counts[topicKey] ?? 0}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center py-4">
        <OrderToggle
          value={sort}
          onChange={setSort}
          labels={{ recent: labels.sortRecent, updated: labels.sortUpdated }}
        />
      </div>

      {visiblePosts.length > 0 ? (
        <div>
          {visiblePosts.map((post, index) => {
            const postTopic = post.topics[0]
            const shortLabel = postTopic
              ? topicMeta[postTopic].shortLabel
              : undefined

            return (
              <LedgerRow
                key={post.slug}
                post={post}
                index={index}
                shortLabel={shortLabel}
              />
            )
          })}
        </div>
      ) : (
        <div className="border-y border-(--border) py-10 text-sm text-(--muted)">
          {labels.empty}
        </div>
      )}

      {filtered.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + pageSize)}
          className="mt-8 inline-flex items-center gap-2 border border-(--border) px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted-strong) transition-colors hover:border-(--signal) hover:text-(--signal)"
        >
          {labels.loadMore}
        </button>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `web/src/app/[locale]/blog/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { LedgerConsole } from '@/features/blog/ledger-console'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { listPosts } from '@/lib/content'
import type { SortOrder } from '@/features/blog/order-toggle'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('blog.metaTitle'),
    description: t('blog.metaDescription'),
    alternates: {
      canonical: '/blog',
    },
  }
}

function parseSort(value: string | undefined): SortOrder | undefined {
  return value === 'updated' ? 'updated' : undefined
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; topic?: string; sort?: string }>
}) {
  const { locale } = await params
  const { q, topic: topicParam, sort: sortParam } = await searchParams

  if (locale !== 'pt-BR') {
    redirect('/blog')
  }

  const t = await getTranslations()
  const posts = await listPosts()
  const topicResult = topicParam ? topicSchema.safeParse(topicParam) : null
  const topicMeta = Object.fromEntries(
    topicOrder.map((topic) => {
      const meta = getTopicMeta(t, topic)

      return [topic, { label: meta.label, shortLabel: meta.shortLabel }]
    }),
  ) as Record<Topic, { label: string; shortLabel: string }>

  return (
    <>
      <Header
        locale="pt-BR"
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <div className="eyebrow">{t('blog.eyebrow')}</div>
            <h1 className="mt-5 max-w-md text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {t('blog.title')}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-(--muted)">
              {t('blog.description')}
            </p>
            <div className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-(--muted)">
              <span className="signal-dot" />
              {t('blog.signalsPublished', { count: posts.length })}
            </div>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={undefined}
            labels={{
              searchPlaceholder: t('console.searchPlaceholder'),
              allTopics: t('console.allTopics'),
              sortRecent: t('console.sortRecent'),
              sortUpdated: t('console.sortUpdated'),
              loadMore: t('console.loadMore'),
              empty: t('console.empty'),
              countLabel: t('console.countLabel'),
            }}
            topicMeta={topicMeta}
            initialTopic={topicResult?.success ? (topicResult.data as Topic) : undefined}
            initialQuery={q}
            initialSort={parseSort(sortParam)}
          />
        </div>
      </main>
      <Footer
        locale="pt-BR"
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
```

Note: the console only needs `label`/`shortLabel`, so the map strips `description` from the topic meta (the code block above does this via a fresh object literal).

- [ ] **Step 4: Rewrite `web/src/app/[locale]/topics/[topic]/page.tsx`**

```tsx
import { topicSchema, type Topic } from '@nexsift/schemas/topic'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { LedgerConsole } from '@/features/blog/ledger-console'
import { Breadcrumbs } from '@/features/blog/breadcrumbs'
import { getTopicMeta, topicOrder } from '@/lib/topics'
import { listPostsByTopic } from '@/lib/content'
import type { SortOrder } from '@/features/blog/order-toggle'

export const dynamic = 'force-dynamic'

function parseSort(value: string | undefined): SortOrder | undefined {
  return value === 'updated' ? 'updated' : undefined
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; topic: string }>
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const { locale, topic: rawTopic } = await params
  const { q, sort: sortParam } = await searchParams

  if (locale !== 'pt-BR') {
    redirect(`/topics/${rawTopic}`)
  }

  const result = topicSchema.safeParse(rawTopic)

  if (!result.success) {
    notFound()
  }

  const topic = result.data as Topic
  const posts = await listPostsByTopic(topic)
  const t = await getTranslations()
  const meta = getTopicMeta(t, topic)
  const topicMeta = Object.fromEntries(
    topicOrder.map((topicKey) => {
      const meta = getTopicMeta(t, topicKey)

      return [topicKey, { label: meta.label, shortLabel: meta.shortLabel }]
    }),
  ) as Record<Topic, { label: string; shortLabel: string }>

  return (
    <>
      <Header
        locale="pt-BR"
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <main className="page-shell min-h-[75vh] py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr]">
          <div data-topic={topic} className="topic-color lg:sticky lg:top-10 lg:self-start">
            <Breadcrumbs
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.topics'), href: '/#topics' },
                { label: meta.label },
              ]}
              topic={topic}
            />
            <div className="eyebrow text-(--topic-color)">
              {t('topicPage.frequency')} / {meta.shortLabel}
            </div>
            <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.075em]">
              {meta.label}
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-(--muted)">
              {meta.description}
            </p>
          </div>
          <LedgerConsole
            posts={posts}
            fixedTopic={topic}
            labels={{
              searchPlaceholder: t('console.searchPlaceholder'),
              allTopics: t('console.allTopics'),
              sortRecent: t('console.sortRecent'),
              sortUpdated: t('console.sortUpdated'),
              loadMore: t('console.loadMore'),
              empty: t('console.empty'),
              countLabel: t('console.countLabel'),
            }}
            topicMeta={topicMeta}
            initialTopic={topic}
            initialQuery={q}
            initialSort={parseSort(sortParam)}
          />
        </div>
      </main>
      <Footer
        locale="pt-BR"
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
```

- [ ] **Step 5: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 10: not-found and remaining hardcoded copy

**Files:**
- Rewrite: `web/src/app/not-found.tsx`

**Interfaces:**
- Produces: not-found page translated via `getTranslations({ locale: 'pt-BR' })`.

- [ ] **Step 1: Rewrite `web/src/app/not-found.tsx`**

```tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations({ locale: 'pt-BR' })

  return (
    <main className="page-shell grid min-h-screen place-items-center py-16">
      <div className="w-full max-w-3xl border-y border-(--border) py-12">
        <div className="eyebrow text-(--signal)">{t('notFound.eyebrow')}</div>
        <h1 className="mt-5 text-6xl font-medium tracking-[-0.07em] md:text-8xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-6 max-w-xl text-(--muted)">{t('notFound.body')}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-(--radius-sm) bg-(--signal) px-4 py-2.5 text-sm font-semibold text-(--on-signal)"
        >
          {t('notFound.back')}
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 11: Dynamic OG image per post

**Files:**
- Create: `web/src/app/[locale]/blog/[slug]/opengraph-image.tsx`

**Interfaces:**
- Produces: `/blog/{slug}/opengraph-image` auto-linked by Next to the article metadata.

- [ ] **Step 1: Create the route file**

```tsx
import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/content'

export const alt = 'NexSift, sinais verificados para desenvolvedores'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const topicColors: Record<string, string> = {
  ai: '#c9a7ff',
  'aws-cloud': '#6de7e7',
  development: '#ff9c73',
  devops: '#c7f66b',
  career: '#ffd166',
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const topic = post?.topics[0]
  const accent = topic ? topicColors[topic] : '#c7f66b'

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#090b0d',
        color: '#f4f7f2',
        padding: '72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 7,
              border: '1px solid #354239',
              background: '#101418',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-1px',
                color: '#c7f66b',
              }}
            >
              N/
            </span>
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 5,
                height: 5,
                borderRadius: 999,
                background: '#c7f66b',
              }}
            />
          </div>
          <div style={{ fontSize: 28, letterSpacing: '-0.03em' }}>NEXSIFT</div>
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 18,
            letterSpacing: '0.1em',
            color: accent,
          }}
        >
          {post ? `SIGNAL / ${topic?.toUpperCase() ?? ''}` : '404 / NO SIGNAL'}
        </div>
      </div>
      <div
        style={{
          fontSize: post && post.title.length > 90 ? 44 : 64,
          lineHeight: 1.05,
          letterSpacing: '-0.05em',
          maxWidth: 900,
        }}
      >
        {post ? post.title : 'Frequência não encontrada'}
      </div>
      <div style={{ fontSize: 24, color: '#98a29a' }}>
        {post ? post.description : 'NexSift, menos ruído e mais sinal'}
      </div>
    </div>,
    size,
  )
}
```

- [ ] **Step 2: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 12: Tailwind v4 syntax migration and button audit

**Files:**
- Modify (mechanical): every `.tsx` file under `web/src` still containing `[var(--` patterns: `components/header.tsx`, `components/footer.tsx`, `components/locale-switcher.tsx`, `features/landing/process-line.tsx`, `app/[locale]/about/page.tsx` (remaining occurrences in files rewritten by earlier tasks are already v4-clean).

**Interfaces:**
- Produces: no `[var(--x)]` class remains; all signal-background buttons use `text-(--on-signal)`.

- [ ] **Step 1: Apply the token mapping**

For each of the following, do a project-wide replace of the bracket form with the v4 form across `web/src`:

| From | To |
| --- | --- |
| `[var(--border)]` | `(--border)` |
| `[var(--border-strong)]` | `(--border-strong)` |
| `[var(--surface)]` | `(--surface)` |
| `[var(--surface-raised)]` | `(--surface-raised)` |
| `[var(--surface-soft)]` | `(--surface-soft)` |
| `[var(--background)]` | `(--background)` |
| `[var(--signal)]` | `(--signal)` |
| `[var(--signal-soft)]` | `(--signal-soft)` |
| `[var(--muted)]` | `(--muted)` |
| `[var(--muted-strong)]` | `(--muted-strong)` |
| `[var(--foreground)]` | `(--foreground)` |
| `[var(--topic-color)]` | `(--topic-color)` |
| `[var(--radius-sm)]` | `(--radius-sm)` |
| `[var(--radius-md)]` | `(--radius-md)` |
| `[var(--radius-lg)]` | `(--radius-lg)` |

- [ ] **Step 2: Replace loose hexes**

| From | To |
| --- | --- |
| `bg-[#090b0de6]` | `bg-(--header-bg)` |
| `text-[#0b0d0a]` and `text-[#090b0d]` on signal backgrounds | `text-(--on-signal)` |

The only remaining `text-[#090b0d]`-style literals should be `text-(--on-signal)` after this step.

- [ ] **Step 3: Button audit**

Confirm every element with `bg-(--signal)` or `bg-(--topic-color)` as background has dark text (`text-(--on-signal)` or `text-[#090b0d]` replaced in step 2). Check hover states do not introduce white text. Files in scope: `header.tsx`, `not-found.tsx`, `page.tsx` (hero CTA), `process-line.tsx` (bottom bar is decoration, not text), `order-toggle.tsx`, `ledger-console.tsx`, `follow-section.tsx`.

- [ ] **Step 4: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 13: Licenses and README

**Files:**
- Create: `LICENSE`
- Create: `LICENSE-CONTENT.md`
- Modify: `README.md`

**Interfaces:**
- Produces: MIT license (code) and CC BY-NC-ND 4.0 (editorial content) with explicit no-misattribution clause.

- [ ] **Step 1: Create `LICENSE`**

Full MIT license text:

```
MIT License

Copyright (c) 2026 Tiago Gonçalves de Castro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Create `LICENSE-CONTENT.md`**

Content: title "NexSift Editorial Content License", statement that editorial content (all post content under `public/indexes/` and `public/posts/`, published posts, and pt-BR editorial copy) is licensed under CC BY-NC-ND 4.0, copyright Tiago Gonçalves de Castro. Include: the four CC conditions (Attribution, NonCommercial, NoDerivatives, ShareAlike excluded), the explicit clause "It is forbidden to attribute authorship of this content to third parties, including AI systems or assistants; attribution must always credit Tiago Gonçalves de Castro", and a link to https://creativecommons.org/licenses/by-nc-nd/4.0/. Note that code is licensed separately under MIT (see `LICENSE`).

- [ ] **Step 3: Add a "Licensing" section to `README.md`**

Short section: code under MIT (c) Tiago Gonçalves de Castro; editorial content under CC BY-NC-ND 4.0 with mandatory attribution and no third-party authorship attribution; links to both license files.

- [ ] **Step 4: Verify**

Run: `yarn workspace @nexsift/web typecheck`
Expected: no errors.

---

### Task 14: Final verification and security rescan

**Files:**
- No code changes expected.

- [ ] **Step 1: Lint**

Run: `yarn lint`
Expected: no errors.

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: no errors (web and lambda).

- [ ] **Step 3: Build**

Run: `yarn build`
Expected: lambda build and web build succeed. S3 connection errors at request time are expected when MiniStack is down; build-time failures from S3 are also acceptable and must be reported, not silently worked around.

- [ ] **Step 4: Security rescan**

Run: `grep -rn "phc_\|sk-\|AKIA\|aws_secret\|SECRET_KEY\|Bearer " --include='*.{ts,tsx,json,yml,yaml,tf}' . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.yarn --exclude-dir=data --exclude-dir=.git`
Expected: no output. Also confirm `git status` shows no tracked `.env` files and that no client component imports `@/lib/content` or reads `process.env` (grep `ledger-console.tsx` and `order-toggle.tsx`).

- [ ] **Step 5: Report**

Summarize completed work, verification results, the security audit outcome, and flag the open items for user decision (GitHub publication, INPI registration, Search Console submission, local index regeneration via `yarn dev:publish` to populate `updatedAt`).
