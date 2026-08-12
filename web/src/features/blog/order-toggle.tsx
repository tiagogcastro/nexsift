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
              ? 'bg-(--signal) text-black'
              : 'text-(--muted) hover:text-(--foreground)'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
