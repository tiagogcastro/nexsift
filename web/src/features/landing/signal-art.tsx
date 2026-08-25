// Decorative "noise becomes signal" artwork in the NexSift visual language:
// chaotic muted lines cross a gate and leave as one clean chartreuse pulse.
// Purely presentational, theme-aware through design tokens.
export function SignalArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 320"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern
          id="signal-art-grid"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M48 0H0V48"
            stroke="var(--border)"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
      </defs>

      <rect width="1200" height="320" fill="url(#signal-art-grid)" opacity="0.5" />

      {/* radar sweep */}
      <g opacity="0.35">
        <circle cx="1072" cy="160" r="52" stroke="var(--border-strong)" strokeWidth="1" />
        <circle cx="1072" cy="160" r="96" stroke="var(--border)" strokeWidth="1" />
        <circle cx="1072" cy="160" r="140" stroke="var(--border)" strokeWidth="1" />
        <path
          d="M1072 20A140 140 0 0 1 1198 122"
          stroke="var(--signal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line x1="1072" y1="160" x2="1160" y2="86" stroke="var(--signal)" strokeWidth="1" opacity="0.5" />
      </g>

      {/* incoming noise */}
      <polyline
        points="0,152 38,168 72,128 106,184 138,118 174,188 208,138 244,178 278,112 314,192 348,134 384,172 418,124 452,182 488,144 520,166 556,158"
        stroke="var(--muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <polyline
        points="0,204 48,182 88,216 128,176 168,212 208,182 248,206 288,176 328,202 368,182 408,202 448,186 488,200 528,170 556,162"
        stroke="var(--muted)"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <polyline
        points="0,110 44,126 84,94 124,132 164,102 204,134 244,108 284,130 324,104 364,128 404,110 444,128 484,114 524,126 556,154"
        stroke="var(--muted)"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.2"
      />

      {/* the gate */}
      <g>
        <rect
          x="568"
          y="64"
          width="64"
          height="192"
          stroke="var(--signal)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="var(--surface-soft)"
          opacity="0.9"
        />
        <line x1="600" y1="40" x2="600" y2="56" stroke="var(--signal)" strokeWidth="1.5" />
        <line x1="600" y1="264" x2="600" y2="280" stroke="var(--signal)" strokeWidth="1.5" />
        <circle cx="600" cy="160" r="4" fill="var(--signal)"  />
      </g>

      {/* clean pulse out of the gate */}
      <path
        d="M632 160H856l24-0.5 22-62 22 124 22-61.5h224"
        stroke="var(--signal)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* verified source ticks */}
      <g opacity="0.8">
        <line x1="912" y1="196" x2="912" y2="212" stroke="var(--cyan)" strokeWidth="2" />
        <line x1="956" y1="196" x2="956" y2="212" stroke="var(--topic-ai)" strokeWidth="2" />
        <line x1="1000" y1="196" x2="1000" y2="212" stroke="var(--topic-development)" strokeWidth="2" />
      </g>
      <circle cx="912" cy="160" r="3" fill="var(--cyan)" />
      <circle cx="956" cy="160" r="3" fill="var(--topic-ai)" />
      <circle cx="1000" cy="160" r="3" fill="var(--topic-development)" />

      <line x1="0" y1="288" x2="1200" y2="288" stroke="var(--border)" strokeWidth="1" />
      {[80, 240, 400, 720, 880, 1120].map((x) => (
        <line key={x} x1={x} y1="284" x2={x} y2="292" stroke="var(--muted)" strokeWidth="1" opacity="0.5" />
      ))}
    </svg>
  )
}
