export function ProcessLine({
  steps,
}: {
  steps: string[]
}) {
  return (
    <div className="grid border border-[var(--border)] sm:grid-cols-5">
      {steps.map((step, index) => (
        <div
          key={step}
          className="relative min-h-32 border-b border-[var(--border)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <div className="font-mono text-[10px] text-[var(--muted)]">
            0{index + 1}
          </div>
          <div className="mt-10 text-sm font-medium">{step}</div>
          <div
            className={`absolute bottom-0 left-0 h-[2px] ${
              index === steps.length - 1
                ? 'w-full bg-[var(--signal)]'
                : 'w-1/2 bg-[var(--border-strong)]'
            }`}
          />
        </div>
      ))}
    </div>
  )
}
