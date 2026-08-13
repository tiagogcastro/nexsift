const stepWidths = [100, 78, 58, 40, 20]

export function Funnel({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const width = `${stepWidths[index] ?? 20}%`

        return (
          <li key={step} className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-(--muted)">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className={`flex items-center gap-3 rounded-(--radius-sm) border px-4 py-3.5 text-sm leading-snug transition-colors ${
                isLast
                  ? 'border-(--signal) bg-(--signal) font-semibold text-(--on-signal)'
                  : 'border-(--border) text-(--muted-strong)'
              }`}
              style={{ width: `min(${width}, 100%)` }}
            >
              {isLast ? (
                <span className="inline-block size-1.5 shrink-0 rounded-full bg-(--on-signal)" />
              ) : null}
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
