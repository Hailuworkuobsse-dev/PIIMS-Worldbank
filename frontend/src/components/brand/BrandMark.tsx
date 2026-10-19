/**
 * PIIMS brand mark — mirrors public/icons/favicon.svg.
 *
 * Sizing scale (keep consistent):
 *   hero / landing masthead … h-16 w-16 (64px)
 *   login brand panel ……… h-14 w-14 (56px)
 *   mobile brand strip ……… h-11 w-11 (44px)
 *   compact header (shell) … h-8 w-8  (32px)
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="PIIMS"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#14315E" />
      <path
        d="M32 11 C32 11 47 29.5 47 38.5 a15 15 0 1 1 -30 0 C17 29.5 32 11 32 11 Z"
        fill="#D4A017"
      />
      <rect x="24.5" y="38" width="4" height="8.5" rx="1.2" fill="#fff" opacity=".92" />
      <rect x="30" y="34" width="4" height="12.5" rx="1.2" fill="#fff" opacity=".92" />
      <rect x="35.5" y="30" width="4" height="16.5" rx="1.2" fill="#fff" opacity=".92" />
    </svg>
  );
}
