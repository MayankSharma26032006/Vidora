// VidOra brand mark — the "Peak-V": a white mountain/V with an amber sun dot.
// Transparent background so it sits on any dark surface (sidebar, navbar, auth pages).
export default function Logo({ size = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 140L100 65L140 140"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="100"
        cy="98"
        r="19"
        fill="transparent"
        stroke="#F59E0B"
        strokeWidth="7"
      />
    </svg>
  )
}
