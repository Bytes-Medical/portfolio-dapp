"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import {
  applyRedactions,
  detectRedactions,
  tokenizePlain,
  trimToWord,
  type RedactionSpan,
  type RulesFile,
} from "@/lib/redaction/redact";

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Redaction confirm gate (§8.2). The mandatory human step: regex + heuristics
 * are only suggestions; the user reviews struck/replaced text, can redact more
 * or restore false positives, and only [ CONFIRM & MAP ] releases the redacted
 * string. Nothing leaves the client before onConfirm fires.
 */
export function RedactionGate({
  text,
  busy = false,
  error,
  rules,
  onConfirm,
  onCancel,
}: {
  text: string;
  busy?: boolean;
  error?: string;
  rules?: RulesFile;
  onConfirm: (redacted: string) => void;
  onCancel: () => void;
}) {
  const [spans, setSpans] = useState<RedactionSpan[]>(() =>
    detectRedactions(text, rules),
  );

  const redacted = useMemo(() => applyRedactions(text, spans), [text, spans]);
  const activeCount = spans.filter((s) => s.active).length;
  const suggestionCount = spans.filter((s) => !s.active && s.source === "flag").length;

  function toggle(target: RedactionSpan) {
    setSpans((prev) =>
      prev.flatMap((s) => {
        if (s !== target) return [s];
        if (s.active) {
          // restore: manual spans disappear; rule/flag spans stay as suggestions
          return s.source === "manual" ? [] : [{ ...s, active: false }];
        }
        return [{ ...s, active: true }];
      }),
    );
  }

  function addManual(rawStart: number, rawEnd: number) {
    const { start, end } = trimToWord(text, rawStart, rawEnd);
    setSpans((prev) => {
      if (prev.some((s) => overlaps(s, { start, end }))) return prev;
      const span: RedactionSpan = {
        start,
        end,
        type: "manual",
        token: "[REDACTED]",
        original: text.slice(start, end),
        source: "manual",
        active: true,
      };
      return [...prev, span].sort((a, b) => a.start - b.start);
    });
  }

  // Walk text + spans into renderable nodes.
  const nodes: React.ReactNode[] = [];
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const s of sorted) {
    if (s.start > cursor) nodes.push(...renderPlain(text, cursor, s.start, addManual));
    nodes.push(
      s.active ? (
        <button
          key={`r-${s.start}`}
          type="button"
          onClick={() => toggle(s)}
          title="Redacted — tap to restore"
          className="mx-[1px] bg-ink px-1 font-ui text-[0.8125rem] text-paper hover:opacity-70"
        >
          {s.token}
        </button>
      ) : (
        <button
          key={`f-${s.start}`}
          type="button"
          onClick={() => toggle(s)}
          title={
            s.source === "flag"
              ? "Possible identifier — tap to redact"
              : "Tap to redact"
          }
          className="mx-[1px] border-b-2 border-dotted border-ink px-[1px] hover:bg-ink hover:text-paper"
        >
          {s.original}
        </button>
      ),
    );
    cursor = s.end;
  }
  if (cursor < text.length) {
    nodes.push(...renderPlain(text, cursor, text.length, addManual));
  }

  return (
    <div>
      <p className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
        Confirm redaction
      </p>
      <p className="mt-2 max-w-xl font-typed text-[0.9375rem] text-ink">
        Check nothing identifies a patient. This is what will be sent.
      </p>
      <p className="mt-1 max-w-xl font-ui text-[0.75rem] text-ink-faint">
        Tap any word to redact it; tap a redaction to restore it. Automated name
        detection is imperfect — this human check is the guarantee.
      </p>

      {/* Reviewable text with toggleable spans */}
      <div className="mt-4 whitespace-pre-wrap break-words border border-ink p-4 font-typed text-[0.9375rem] leading-[1.7] text-ink">
        {nodes}
      </div>

      <div className="mt-2 font-ui text-[0.75rem] text-ink-faint">
        {activeCount} redaction{activeCount === 1 ? "" : "s"} ·{" "}
        {suggestionCount} suggestion{suggestionCount === 1 ? "" : "s"} pending
      </div>

      {/* What will actually be sent */}
      <details className="mt-4 border border-rule-faint p-3">
        <summary className="cursor-pointer font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink-muted">
          Preview what will be sent
        </summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-typed text-[0.875rem] text-ink">
          {redacted}
        </pre>
      </details>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => onConfirm(redacted)} disabled={busy}>
          {busy ? "Mapping…" : "Confirm & map"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Back
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 border border-ink bg-inverse-bg p-3 font-ui text-[0.8125rem] text-paper"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function renderPlain(
  text: string,
  from: number,
  to: number,
  addManual: (s: number, e: number) => void,
): React.ReactNode[] {
  return tokenizePlain(text, from, to).map((tok) =>
    tok.isWord ? (
      <button
        key={`p-${tok.start}`}
        type="button"
        onClick={() => addManual(tok.start, tok.end)}
        title="Tap to redact"
        className="cursor-pointer hover:bg-ink hover:text-paper"
      >
        {tok.text}
      </button>
    ) : (
      <span key={`w-${tok.start}`}>{tok.text}</span>
    ),
  );
}
