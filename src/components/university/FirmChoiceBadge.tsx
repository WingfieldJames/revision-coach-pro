/**
 * Small inline provenance pill for the university section: the FirmChoice
 * red-check mark plus a quiet wordmark. The SVG mark is the one FirmChoice
 * ships on its own landing page — a #C8102E circle border around a check.
 */
export const FirmChoiceBadge = () => (
  <span className="inline-flex items-center gap-2">
    <span
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#C8102E]"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 8.5 L6.5 12 L13 4.5"
          stroke="#C8102E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="text-xs text-muted-foreground">FirmChoice by A*AI</span>
  </span>
);
