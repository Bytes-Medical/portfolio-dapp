"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/Button";
import { RedactionGate } from "@/components/RedactionGate";
import { getDraft, saveDraft, clearDraft } from "@/lib/db/drafts";
import { getSettings, saveSettings } from "@/lib/db/settings";
import { createEntry, updateEntry } from "@/lib/db/entries";
import { requestMapping } from "@/lib/map-client";
import { parseRules, type RulesFile } from "@/lib/redaction/redact";
import { ymd } from "@/lib/format";
import type { Entry, Level } from "@/lib/types";

// Lazy-load the voice SDK so typing is instant and the heavy realtime audio
// bundle only loads on the capture screen, after first paint.
const VoiceCapture = dynamic(
  () => import("@/components/VoiceCapture").then((m) => m.VoiceCapture),
  { ssr: false },
);

const PLACEHOLDER =
  "Start typing — or tap Dictate to use your voice. ▋";

type Phase = "capture" | "redact";

export default function CapturePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [level, setLevel] = useState<Level>("core");
  const [loaded, setLoaded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<Phase>("capture");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [redactionRules, setRedactionRules] = useState<RulesFile | undefined>();
  const [today, setToday] = useState("");
  const startedRef = useRef<number | null>(null);
  const entryIdRef = useRef<string | null>(null);

  // Load persisted level + working draft.
  useEffect(() => {
    let active = true;
    (async () => {
      const [settings, draft] = await Promise.all([getSettings(), getDraft()]);
      if (!active) return;
      setLevel(draft?.level ?? settings.level);
      if (draft?.text) setText(draft.text);
      if (settings.overrides?.redactionRules) {
        const parsed = parseRules(settings.overrides.redactionRules);
        if (parsed) setRedactionRules(parsed);
      }
      setToday(ymd(Date.now()));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Elapsed-seconds hint: counts while there is text.
  useEffect(() => {
    if (!text.trim()) {
      startedRef.current = null;
      setSeconds(0);
      return;
    }
    if (startedRef.current === null) startedRef.current = Date.now();
    const id = window.setInterval(() => {
      if (startedRef.current !== null) {
        setSeconds(Math.floor((Date.now() - startedRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [text]);

  // Append a transcribed chunk from voice capture, then persist the draft.
  function appendText(chunk: string) {
    setText((prev) => {
      const sep = prev && !/\s$/.test(prev) ? " " : "";
      const next = prev + sep + chunk;
      void saveDraft(next, level);
      return next;
    });
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasText = text.trim().length > 0;

  async function persist(nextText = text, nextLevel = level) {
    await saveDraft(nextText, nextLevel);
  }

  async function toggleLevel() {
    const next: Level = level === "core" ? "specialty" : "core";
    setLevel(next);
    await Promise.all([saveSettings({ level: next }), persist(text, next)]);
  }

  async function handleProcess() {
    await persist();
    setPhase("redact");
  }

  // The gate has released the redacted string. Persist a redacted-only entry,
  // call /api/map with redacted text only, store the result, then go to review.
  // The note is always saved first, so a mapping failure never loses work (§10.5).
  async function handleConfirm(redacted: string) {
    setSubmitting(true);
    setError(undefined);
    try {
      // Create once; reuse the same entry id on retry to avoid duplicates,
      // refreshing the redacted text in case the user edited before retrying.
      let entryId = entryIdRef.current;
      if (!entryId) {
        const entry = await createEntry({ redactedText: redacted, level });
        entryId = entry.id;
        entryIdRef.current = entryId;
        await clearDraft();
      } else {
        await updateEntry(entryId, { redactedText: redacted });
      }

      const settings = await getSettings();
      const result = await requestMapping({
        text: redacted,
        level,
        model: settings.model,
        overrides: settings.overrides,
      });

      const patch: Partial<Entry> = {
        summary: result.summary,
        candidates: result.mapping_candidates,
        suggestedEntryType: result.suggested_entry_type,
        entryType: result.suggested_entry_type,
        pidFlags: result.pid_flags,
        draft: {
          whatHappened: result.draft_entry.what_happened,
          whatLearned: result.draft_entry.what_i_learned,
          whatNext: result.draft_entry.what_i_will_do_differently,
        },
      };
      await updateEntry(entryId, patch);
      router.push(`/review/${entryId}`);
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (phase === "redact") {
    return (
      <RedactionGate
        text={text}
        busy={submitting}
        error={error}
        rules={redactionRules}
        onConfirm={(redacted) => void handleConfirm(redacted)}
        onCancel={() => {
          setPhase("capture");
          setError(undefined);
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      {/* Memo sheet: header strip + writing surface */}
      <div className="border border-ink bg-paper-raised shadow-[3px_3px_0_0_var(--accent)]">
        <div className="flex items-center justify-between gap-2 border-b border-ink px-3 py-2.5 sm:px-4">
          <span className="flex min-w-0 items-center gap-2 font-ui uppercase text-[0.625rem] tracking-[0.14em] text-ink-muted">
            <span aria-hidden="true" className="text-accent">
              ▪
            </span>
            <span className="truncate">
              <span className="hidden sm:inline">byte portfolio · </span>new entry
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden font-ui text-[0.625rem] tracking-[0.08em] text-ink-faint sm:inline">
              {today}
            </span>
            <button
              type="button"
              onClick={() => void toggleLevel()}
              aria-label={`Training level: ${level}. Tap to switch.`}
              className="shrink-0 border border-ink px-2 py-1 font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {level === "core" ? "Core" : "Specialty"}
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => void persist()}
          placeholder={PLACEHOLDER}
          spellCheck
          autoCapitalize="sentences"
          rows={12}
          className="font-typed block min-h-[46vh] w-full resize-none border-0 bg-paper-raised p-5 text-[1.0625rem] leading-[1.75] text-ink placeholder:text-ink-faint focus:outline-none"
          aria-label="Capture a clinical learning moment"
        />
      </div>

      <div className="mt-4">
        <VoiceCapture onCommit={appendText} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule-faint pt-4">
        <p className="font-ui text-[0.75rem] text-ink-faint" aria-live="polite">
          {words} {words === 1 ? "word" : "words"} · {seconds}s
        </p>
        <Button
          onClick={() => void handleProcess()}
          disabled={!loaded || !hasText}
          offset={hasText}
        >
          Process
        </Button>
      </div>
    </div>
  );
}
