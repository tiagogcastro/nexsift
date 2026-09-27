interface Step {
  title: string
  description: string
}

const positions = [
  { x: 90, y: 245 },
  { x: 330, y: 75 },
  { x: 590, y: 245 },
  { x: 850, y: 75 },
  { x: 1120, y: 245 },
]

export function PathTrail({ steps }: { steps: Step[] }) {
  return <div>
    <ol className="relative hidden h-[330px] lg:block">
      <svg viewBox="0 0 1200 330" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <path d="M90 245 C190 245 220 75 330 75 S480 245 590 245 S740 75 850 75 S1010 245 1120 245" className="path-trail-line" />
        <path d="M850 75 C950 75 1010 245 1120 245" className="path-trail-line-active" />
      </svg>
      {steps.map((step, index) => {
        const point = positions[index]
        if (!point) return null
        const below = index % 2 === 1
        const last = index === steps.length - 1
        return <li key={step.title} className="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center" style={{ left: `${(point.x / 1200) * 100}%`, top: `${(point.y / 330) * 100}%` }}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold ${last ? 'border-(--signal) bg-(--signal) text-(--on-signal)' : 'border-(--border-strong) bg-(--surface-raised) text-(--muted-strong)'}`}>{String(index + 1).padStart(2, '0')}</span>
            <div className={`absolute left-1/2 w-[min(18vw,200px)] -translate-x-1/2 ${below ? 'top-12' : 'bottom-12'}`}>
              <h3 className={`text-xs font-semibold leading-tight ${last ? 'text-(--signal)' : 'text-(--foreground)'}`}>{step.title}</h3>
              <p className="mt-1 text-[11px] leading-snug text-(--muted-strong)">{step.description}</p>
            </div>
        </li>
      })}
    </ol>
    <ol className="relative space-y-1 lg:hidden">
      <svg viewBox="0 0 40 420" preserveAspectRatio="none" className="pointer-events-none absolute left-0 top-9 h-[calc(100%-4.5rem)] w-10" aria-hidden="true">
        <path d="M20 0 C4 46 36 70 20 105 S4 175 20 210 S36 280 20 315 S4 385 20 420" className="path-trail-line" />
      </svg>
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return <li key={step.title} className="relative grid min-h-18 grid-cols-[2.5rem_1fr] items-center gap-3 py-2">
          <span className={`grid size-10 place-items-center rounded-full border font-mono text-xs font-semibold ${last ? 'border-(--signal) bg-(--signal) text-(--on-signal)' : 'border-(--border-strong) bg-(--surface-raised) text-(--muted-strong)'}`}>{String(index + 1).padStart(2, '0')}</span>
          <div><h3 className={`text-sm font-semibold ${last ? 'text-(--signal)' : ''}`}>{step.title}</h3><p className="mt-0.5 text-xs leading-snug text-(--muted-strong)">{step.description}</p></div>
        </li>
      })}
    </ol>
  </div>
}
