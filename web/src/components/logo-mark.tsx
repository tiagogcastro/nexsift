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
