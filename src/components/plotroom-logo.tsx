export function PlotroomLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Plotroom"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <rect x="21" y="18" width="5" height="30" fill="var(--logo-ink)" />
      <circle
        cx="33"
        cy="28"
        r="7.5"
        fill="none"
        stroke="var(--logo-accent)"
        strokeWidth="5"
      />
    </svg>
  );
}
