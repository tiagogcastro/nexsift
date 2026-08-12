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

The primary editorial primitive is a signal ledger.

Each row communicates:

1. position in the current set
2. frequency or topic
3. title and short context
4. relevance score
5. publication date

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
| cyan | `#6DE7E7` | cloud frequency |
| orchid | `#C9A7FF` | AI frequency |
| coral | `#FF9C73` | development frequency |
| amber | `#FFD166` | career frequency |

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

## Article layout

Desktop articles use three information zones:

1. sticky metadata rail
2. central editorial column
3. sticky source rail

The source rail keeps traceability visible while reading and makes source grounding part of the interface, not a footnote.
