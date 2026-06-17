import { lookupCapability } from "@/lib/rules-engine/curriculum";
import type { MappingCandidate as Candidate } from "@/lib/types";

/** Monospace confidence bar ▰▰▰▱▱ (§8.3). */
export function ConfidenceBar({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value * 5)));
  return (
    <span
      className="font-ui text-[0.8125rem]"
      aria-label={`confidence ${Math.round(value * 100)} percent`}
    >
      <span className="text-accent">{"▰".repeat(filled)}</span>
      <span className="text-ink-faint">{"▱".repeat(5 - filled)}</span>{" "}
      <span className="text-ink-muted">{Math.round(value * 100)}%</span>
    </span>
  );
}

/** A single ranked mapping candidate, selectable as a radio (§8.3). */
export function MappingCandidate({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const look = lookupCapability(
    candidate.domain_id,
    candidate.learning_outcome_id,
    candidate.key_capability_id,
  );
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`block w-full p-3 text-left transition-colors ${
        selected
          ? "border-2 border-accent bg-accent-weak/40"
          : "border border-rule-faint hover:border-ink"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`font-ui text-[0.875rem] leading-none ${selected ? "text-accent" : "text-ink"}`}
        >
          {selected ? "▣" : "▢"}
        </span>
        <span className="border border-ink px-1 font-ui text-[0.625rem] tracking-[0.06em]">
          D{candidate.domain_id}
        </span>
        <span className="font-ui uppercase text-[0.75rem] tracking-[0.08em] text-ink">
          {candidate.domain_name}
        </span>
      </div>

      <div className="mt-2 font-ui text-[0.6875rem] tracking-[0.06em] text-ink-muted">
        {candidate.learning_outcome_id} ▸ {candidate.key_capability_id}
      </div>
      {look.kcText ? (
        <p className="mt-1 font-typed text-[0.875rem] text-ink">{look.kcText}</p>
      ) : null}

      <div className="mt-2">
        <ConfidenceBar value={candidate.confidence} />
      </div>
      {candidate.rationale ? (
        <p className="mt-1 font-typed text-[0.8125rem] text-ink-muted">
          {candidate.rationale}
        </p>
      ) : null}
    </button>
  );
}
