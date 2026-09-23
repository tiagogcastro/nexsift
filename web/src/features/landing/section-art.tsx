export function SectionArt({ variant }: { variant: 'filter' | 'trace' }) {
  return (
    <div aria-hidden="true" className="overflow-hidden border-b border-(--border) bg-(--background)">
      <svg
        viewBox="0 0 1200 112"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="block h-20 w-full md:h-28"
      >
        {variant === 'filter' ? (
          <>
            <path d="M0 56h390m420 0h390" stroke="var(--border)" />
            <path d="M390 56c70 0 78-35 150-35h105c68 0 75 35 165 35" stroke="var(--border-strong)" />
            <path d="M390 56c70 0 78 35 150 35h105c68 0 75-35 165-35" stroke="var(--border-strong)" />
            <path d="M548 21v70m104-70v70" stroke="var(--border)" strokeDasharray="3 5" />
            <circle cx="600" cy="56" r="22" fill="var(--background)" stroke="var(--border-strong)" />
            <path d="m590 56 7 7 14-16" stroke="var(--signal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="436" cy="39" r="2" fill="var(--muted)" />
            <circle cx="436" cy="73" r="2" fill="var(--muted)" />
            <circle cx="766" cy="56" r="3" fill="var(--signal)" />
          </>
        ) : (
          <>
            <path d="M0 56h400m400 0h400" stroke="var(--border)" />
            <path d="M400 56h95l38-25h140l38 25h89" stroke="var(--border-strong)" />
            <path d="M400 56h95l38 25h140l38-25h89" stroke="var(--border-strong)" />
            <path d="M533 31h140" stroke="var(--signal)" strokeWidth="1.5" />
            <circle cx="533" cy="31" r="4" fill="var(--background)" stroke="var(--signal)" />
            <circle cx="673" cy="31" r="4" fill="var(--signal)" />
            <circle cx="600" cy="81" r="12" stroke="var(--border-strong)" />
            <circle cx="600" cy="81" r="3" fill="var(--muted)" />
          </>
        )}
      </svg>
    </div>
  )
}
