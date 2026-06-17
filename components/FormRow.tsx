import type { ReactNode } from "react";

/**
 * Dotted-leader form row: LABEL ......... value (§5.3).
 * The structural device that encodes "this is a form being filled".
 * Use only for true field/value pairs.
 */
export function FormRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline font-ui text-[0.8125rem] ${className}`}>
      <span className="uppercase tracking-[0.12em] text-ink-muted whitespace-nowrap">
        {label}
      </span>
      <span className="leader" aria-hidden="true" />
      <span className="text-ink whitespace-nowrap">{value}</span>
    </div>
  );
}
