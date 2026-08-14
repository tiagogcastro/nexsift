interface Point {
  x: number
  y: number
}

const DESKTOP_VIEWBOX = { width: 1200, height: 340 }

const desktopNodes: Point[] = [
  { x: 90, y: 265 },
  { x: 330, y: 70 },
  { x: 590, y: 250 },
  { x: 850, y: 70 },
  { x: 1120, y: 230 },
]

const mobileConnectors = [
  'M 12 0 C 7 5, 17 15, 12 20',
  'M 12 0 C 17 5, 7 15, 12 20',
  'M 12 0 C 7 5, 17 15, 12 20',
  'M 12 0 C 17 5, 7 15, 12 20',
]

function buildSmoothPath(points: readonly Point[]): string {
  const segments: string[] = []

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]

    if (!current || !next) {
      break
    }

    const previous = points[index - 1] ?? current
    const after = points[index + 2] ?? next

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    }
    const control2 = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    }

    segments.push(`C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${next.x} ${next.y}`)
  }

  return `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0} ${segments.join(' ')}`
}

function buildSegments(points: readonly Point[]): string[] {
  const segments: string[] = []

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]

    if (!current || !next) {
      break
    }

    const previous = points[index - 1] ?? current
    const after = points[index + 2] ?? next

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    }
    const control2 = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    }

    segments.push(`M ${current.x} ${current.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${next.x} ${next.y}`)
  }

  return segments
}

function percent(point: Point, size: { width: number; height: number }) {
  return {
    left: `${(point.x / size.width) * 100}%`,
    top: `${(point.y / size.height) * 100}%`,
  }
}

// Progress segment: signal color, stronger the closer it gets to SINAL.
// The last segment carries the glow. The base trail stays muted behind it.
function TrailSegments({ points }: { points: readonly Point[] }) {
  const segments = buildSegments(points)
  const lastIndex = segments.length - 1

  return (
    <>
      <path d={buildSmoothPath(points)} className="path-trail-line" />
      {segments.map((segment, index) => {
        const isLast = index === lastIndex

        return (
          <path
            key={segment}
            d={segment}
            className={
              isLast ? 'path-trail-line-active' : 'path-trail-line-progress'
            }
            opacity={0.35 + index * 0.22}
          />
        )
      })}
    </>
  )
}

export function PathTrail({ steps }: { steps: string[] }) {
  return (
    <div>
      <div className="relative hidden aspect-[1200/340] w-full lg:block">
        <svg
          viewBox={`0 0 ${DESKTOP_VIEWBOX.width} ${DESKTOP_VIEWBOX.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          <TrailSegments points={desktopNodes} />
        </svg>
        {steps.map((step, index) => {
          const node = desktopNodes[index]

          if (!node) {
            return null
          }

          const isLast = index === steps.length - 1
          const position = percent(node, DESKTOP_VIEWBOX)
          const labelAbove = index % 2 === 1

          return (
            <div
              key={step}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              <div className="flex flex-col items-center">
                {labelAbove && !isLast ? (
                  <span className="mb-2 max-w-32 text-center font-mono text-[10px] leading-snug tracking-[0.06em] text-(--muted)">
                    {step}
                  </span>
                ) : null}
                <span
                  className={`grid size-11 place-items-center rounded-full border font-mono text-xs font-semibold ${
                    isLast
                      ? 'border-(--signal) bg-(--signal) text-(--on-signal) shadow-[0_0_24px_var(--signal-glow)]'
                      : 'border-(--border-strong) bg-(--surface-raised) text-(--muted-strong)'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {!labelAbove ? (
                  <span
                    className={`mt-2 max-w-32 text-center font-mono text-[10px] leading-snug tracking-[0.06em] ${
                      isLast ? 'text-(--signal)' : 'text-(--muted)'
                    }`}
                  >
                    {step}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="lg:hidden">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <div key={step} className="grid grid-cols-[3rem_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid size-10 place-items-center rounded-full border font-mono text-[11px] font-semibold ${
                    isLast
                      ? 'border-(--signal) bg-(--signal) text-(--on-signal) shadow-[0_0_24px_var(--signal-glow)]'
                      : 'border-(--border-strong) bg-(--surface-raised) text-(--muted-strong)'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {!isLast ? (
                  <svg viewBox="0 0 24 20" className="mt-1 h-5 w-6" aria-hidden>
                    <path
                      d={mobileConnectors[index] ?? ''}
                      className={
                        index === mobileConnectors.length - 1
                          ? 'path-trail-line-active path-trail-line-thick'
                          : 'path-trail-line-progress path-trail-line-thick'
                      }
                      opacity={0.35 + index * 0.22}
                    />
                  </svg>
                ) : null}
              </div>
              <div
                className={`pt-2.5 text-sm leading-snug ${
                  isLast ? 'font-semibold text-(--signal)' : 'text-(--muted-strong)'
                }`}
              >
                {step}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}