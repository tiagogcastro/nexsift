import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  FileText,
  Filter,
  Search,
  Send,
} from 'lucide-react'

const nodeFills = ['14%', '32%', '50%', '72%', '100%']
const stepIcons = [Search, Filter, BadgeCheck, FileText, Send]

export function ProcessLine({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col md:flex-row md:items-start">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const Icon = stepIcons[index] ?? Search

        return (
          <li
            key={step}
            className="flex flex-col md:flex-1 md:flex-row md:items-start"
          >
            <div className="flex items-center gap-3 md:flex-col md:items-center md:gap-3 md:text-center">
              <span
                aria-hidden
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-(--border-strong) ${
                  index >= 3 ? 'text-(--on-signal)' : 'text-(--foreground)'
                }`}
                style={{
                  backgroundColor: `color-mix(in srgb, var(--signal) ${nodeFills[index] ?? '0%'}, var(--surface-soft))`,
                }}
              >
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span
                className={`flex items-baseline gap-1.5 text-sm ${
                  isLast
                    ? 'font-medium text-(--foreground)'
                    : 'text-(--muted-strong)'
                }`}
              >
                <span className="font-mono text-[10px] font-semibold text-(--muted-strong)">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step}
              </span>
            </div>

            {!isLast ? (
              <span
                aria-hidden
                className="relative flex md:mt-5 md:flex-1 md:items-center"
              >
                <span className="ml-[1.15rem] block h-5 w-px shrink-0 bg-(--border-strong) md:hidden" />
                <ArrowDown
                  className="absolute left-[1.05rem] top-0 hidden text-(--muted) md:hidden"
                  size={12}
                />
                <span className="mx-4 hidden h-px flex-1 bg-(--border-strong) md:block" />
                <ArrowRight
                  className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-(--muted) md:block"
                  size={16}
                />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
