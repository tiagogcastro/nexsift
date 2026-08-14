# NexSift Design Direction

## Goal

The interface should feel like a technical signal console with editorial depth. It must not look like a generic publication template built from a three-column card grid.

## Reference set

The direction was informed by products and technical publications that use typography, hierarchy and information density well:

- Linear Now: https://linear.app/now
- Raycast Blog: https://www.raycast.com/blog
- Vercel Blog: https://vercel.com/blog
- Resend Blog: https://resend.com/blog
- Stripe Engineering: https://stripe.com/blog/engineering

NexSift does not copy their layouts. The shared lessons are strong typography, useful metadata, deliberate density, restrained decoration and a product identity that remains visible inside editorial content.

## Core visual idea

The primary editorial primitive is the signal radar. The hero pairs the value proposition with a live "No radar agora" panel on the right; the archive ("Sinais") lists every published signal; topic pages are specialized radars. Each signal row communicates topic, type, what changed, relevance, date and source count in a dense, terminal-like scan pattern.

Each row communicates:

1. position in the current set
2. topic and signal type
3. title and short context
4. relevance score (auxiliary)
5. publication date (always visible) and source count

This creates a scan pattern closer to a market terminal, changelog or engineering index than a traditional blog.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| background | `#090B0D` | main canvas |
| surface | `#101418` | panels |
| raised | `#151B20` | selected and elevated states |
| foreground | `#F4F7F2` | primary text |
| muted | `#98A29A` | secondary text |
| border | `#263029` | structure |
| signal | `#C7F66B` | primary action and active signal |
| cyan | `#6DE7E7` | cloud topic |
| orchid | `#C9A7FF` | ai topic |
| coral | `#FF9C73` | development topic |
| chartreuse | `#C7F66B` | devops topic |
| salmon | `#FF8A7A` | security topic |
| amber | `#FFD166` | industry topic |
| pink | `#F0A6D8` | design topic |

The primary accent is chartreuse instead of the common blue SaaS palette.

## Typography

- Geist Sans for product and editorial typography.
- Geist Mono for scores, dates, labels, indexes and technical metadata.
- Large display headlines use tight tracking and line height.
- Body copy prioritizes long-form readability.

## Shape language

- Small and medium radii only.
- Borders carry more visual weight than shadows.
- No rounded card everywhere pattern.
- No decorative glassmorphism.
- No AI robot, brain or circuit imagery.

## Motion

Motion should communicate state or navigation:

- subtle row movement on hover
- signal indicator glow
- small button lift
- future pipeline progress animation

Avoid background particles, parallax and cinematic page transitions.

## Curation path

The curation process is rendered as a winding trail, not a linear pipeline: "Muito acontece" starts the path and each gate question curves toward the next (Isso realmente mudou algo? Há evidência? Tem consequência?) until only "SINAL" remains, drawn in the signal color with a glow. The trail is a smooth SVG curve with numbered nodes; the last segment glows in the signal color. Nodes are non-interactive: no heavy borders, no shadows, no hover affordances. On mobile the trail collapses into a vertical path with a curving rail on the left.

## Topics

Topics are represented by a monochrome lucide icon (brain for AI, cpu for development, cloud, terminal for DevOps, shield for security, factory for industry, pen tool for design) plus their full label. Abbreviated short labels are not used in the UI.

## Article layout

Signals use a two-zone layout: a single editorial column (topic chip with icon; title; byline row; "O que mudou"; "Por que importa"; development; "O que observar agora"; "Continue no radar") and a sticky source rail that keeps traceability visible while reading. Metadata is a discreet mono line under the title, not a rail. Each source is a small bordered card with its verification status as a colored badge. The "Continue no radar" rows carry the related topic chip and source count.
