/**
 * The block caret ▋ — the brand's heartbeat (§5.3).
 * Blinks via CSS (1s step-end); solid under prefers-reduced-motion.
 */
export function Caret({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`caret font-typed ${className}`}>
      ▋
    </span>
  );
}
