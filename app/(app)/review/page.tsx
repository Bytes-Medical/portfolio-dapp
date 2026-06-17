"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { FormRow } from "@/components/FormRow";
import { MappingCandidate } from "@/components/MappingCandidate";
import { getEntry, updateEntry, deleteEntry } from "@/lib/db/entries";
import { getSettings } from "@/lib/db/settings";
import { requestMapping } from "@/lib/map-client";
import type { ChosenMapping, Entry, EntryType } from "@/lib/types";
import { ENTRY_TYPES } from "@/lib/openai/schema";

function ymd(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function needsSupervisor(type: EntryType): boolean {
  return type !== "reflection" && type !== "other";
}

// useSearchParams must sit under a Suspense boundary for static export.
export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <p className="font-ui text-[0.875rem] text-ink-muted">Loading…</p>
      }
    >
      <ReviewInner />
    </Suspense>
  );
}

function ReviewInner() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";

  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const [selIdx, setSelIdx] = useState(0);
  const [entryType, setEntryType] = useState<EntryType>("reflection");
  const [draft, setDraft] = useState({ whatHappened: "", whatLearned: "", whatNext: "" });
  const [nudge, setNudge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    (async () => {
      const e = id ? await getEntry(id) : null;
      if (!active) return;
      setEntry(e ?? null);
      if (e) {
        const idx = e.mapping
          ? Math.max(
              0,
              (e.candidates ?? []).findIndex(
                (c) => c.key_capability_id === e.mapping!.keyCapabilityId,
              ),
            )
          : 0;
        setSelIdx(idx);
        setEntryType(e.entryType ?? e.suggestedEntryType ?? "reflection");
        setDraft(
          e.draft ?? { whatHappened: "", whatLearned: "", whatNext: "" },
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (entry === undefined) {
    return <p className="font-ui text-[0.875rem] text-ink-muted">Loading…</p>;
  }
  if (entry === null) {
    return (
      <div>
        <p className="font-typed text-[1rem] text-ink">Entry not found.</p>
        <div className="mt-4">
          <Button href="/inbox" variant="ghost">
            Back to inbox
          </Button>
        </div>
      </div>
    );
  }

  const candidates = entry.candidates ?? [];
  const chosen = candidates[selIdx];

  async function remap() {
    if (!entry) return;
    setBusy(true);
    setError(undefined);
    try {
      const settings = await getSettings();
      const result = await requestMapping({
        text: entry.redactedText,
        level: entry.level,
        model: settings.model,
        overrides: settings.overrides,
        entryTypeHint: entryType,
        nudge: nudge.trim() || undefined,
      });
      const patch: Partial<Entry> = {
        summary: result.summary,
        candidates: result.mapping_candidates,
        suggestedEntryType: result.suggested_entry_type,
        pidFlags: result.pid_flags,
        draft: {
          whatHappened: result.draft_entry.what_happened,
          whatLearned: result.draft_entry.what_i_learned,
          whatNext: result.draft_entry.what_i_will_do_differently,
        },
      };
      await updateEntry(entry.id, patch);
      setEntry({ ...entry, ...patch });
      setSelIdx(0);
      setDraft(patch.draft!);
      setNudge("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-map failed.");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!entry || !chosen) return;
    setBusy(true);
    setError(undefined);
    try {
      const mapping: ChosenMapping = {
        domainId: chosen.domain_id,
        domainName: chosen.domain_name,
        learningOutcomeId: chosen.learning_outcome_id,
        keyCapabilityId: chosen.key_capability_id,
        confidence: chosen.confidence,
      };
      await updateEntry(entry.id, {
        mapping,
        entryType,
        draft,
        status: "reviewed",
        editedByUser: true,
      });
      router.push("/inbox");
    } catch {
      setBusy(false);
      setError("Could not save. Try again.");
    }
  }

  async function discard() {
    if (!entry) return;
    if (!window.confirm("Discard this entry? This cannot be undone.")) return;
    await deleteEntry(entry.id);
    router.push("/inbox");
  }

  return (
    <div className="pb-8">
      {/* Carbon-copy memo header (§5.3) */}
      <div className="border border-ink p-4">
        <p className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Byte Portfolio · Entry
        </p>
        <div className="mt-3 space-y-1.5">
          <FormRow label="Date" value={ymd(entry.createdAt)} />
          <FormRow label="Type" value={entryType.toUpperCase()} />
          <FormRow
            label="Domain"
            value={chosen ? `${chosen.domain_id} · ${chosen.domain_name}` : "—"}
          />
          <FormRow
            label="Outcome"
            value={chosen ? chosen.key_capability_id : "[unmapped]"}
          />
          <FormRow
            label="Status"
            value={entry.status.toUpperCase()}
          />
        </div>
      </div>

      {/* Entry type selector */}
      <section className="mt-8">
        <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Entry type
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEntryType(t)}
              aria-pressed={entryType === t}
              className={`border px-3 py-2 font-ui text-[0.75rem] uppercase tracking-[0.08em] ${
                entryType === t
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-faint text-ink hover:border-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {needsSupervisor(entryType) ? (
          <p className="mt-2 font-ui text-[0.75rem] text-ink-muted">
            Needs supervisor — this is a supervised assessment (SLE), not a
            self-logged reflection.
          </p>
        ) : null}
      </section>

      {/* Editable draft */}
      <section className="mt-8 space-y-5">
        <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Draft
        </h2>
        <DraftField
          label="What happened"
          value={draft.whatHappened}
          onChange={(v) => setDraft((d) => ({ ...d, whatHappened: v }))}
        />
        <DraftField
          label="What I learned"
          value={draft.whatLearned}
          onChange={(v) => setDraft((d) => ({ ...d, whatLearned: v }))}
        />
        <DraftField
          label="What I'll do differently"
          value={draft.whatNext}
          onChange={(v) => setDraft((d) => ({ ...d, whatNext: v }))}
        />
      </section>

      {/* Mapping candidates */}
      <section className="mt-8">
        <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Mapping {candidates.length ? `· choose one` : ""}
        </h2>
        {candidates.length === 0 ? (
          <p className="mt-3 font-typed text-[0.9375rem] text-ink-muted">
            Not mapped yet. Map it below.
          </p>
        ) : (
          <div role="radiogroup" className="mt-3 space-y-2">
            {candidates.map((c, i) => (
              <MappingCandidate
                key={`${c.key_capability_id}-${i}`}
                candidate={c}
                selected={i === selIdx}
                onSelect={() => setSelIdx(i)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Re-map control */}
      <section className="mt-8 border border-rule-faint p-3">
        <label
          htmlFor="nudge"
          className="font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink-muted"
        >
          Re-map nudge (optional)
        </label>
        <input
          id="nudge"
          value={nudge}
          onChange={(e) => setNudge(e.target.value)}
          placeholder="e.g. this is about teaching, not the clinical case"
          className="mt-2 w-full border-b border-ink bg-paper py-1 font-typed text-[0.875rem] text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <div className="mt-3">
          <Button variant="ghost" onClick={() => void remap()} disabled={busy}>
            {busy ? "Mapping…" : candidates.length ? "Re-map" : "Map"}
          </Button>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="mt-6 border border-ink bg-inverse-bg p-3 font-ui text-[0.8125rem] text-paper"
        >
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={() => void accept()} disabled={busy || !chosen}>
          Accept
        </Button>
        <Button variant="ghost" onClick={() => void discard()} disabled={busy}>
          Discard
        </Button>
      </div>
    </div>
  );
}

function DraftField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink-muted">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-y border border-ink bg-paper p-3 font-typed text-[0.9375rem] leading-[1.6] text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      />
    </div>
  );
}
