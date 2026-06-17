"use client";

import { useState } from "react";
import Link from "next/link";
import { ymd } from "@/lib/format";
import {
  copyText,
  downloadFile,
  exportName,
  toKaizenJSON,
  toKaizenMarkdown,
} from "@/lib/export/toKaizen";
import { deleteEntry, updateEntry } from "@/lib/db/entries";
import type { Entry } from "@/lib/types";

/** Inbox mini-card in the carbon-copy idiom (§8.4). */
export function EntryCard({
  entry,
  onChanged,
}: {
  entry: Entry;
  onChanged?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const snippet =
    (entry.draft?.whatHappened || entry.redactedText || "").slice(0, 140) || "—";

  async function markExported() {
    await updateEntry(entry.id, { status: "exported", exportedAt: Date.now() });
    onChanged?.();
  }

  async function onCopy() {
    await copyText(toKaizenMarkdown(entry));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
    await markExported();
  }

  async function onDownload(kind: "md" | "json") {
    if (kind === "md") {
      downloadFile(`${exportName(entry)}.md`, toKaizenMarkdown(entry), "text/markdown");
    } else {
      downloadFile(`${exportName(entry)}.json`, toKaizenJSON(entry), "application/json");
    }
    await markExported();
  }

  async function onDelete() {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    await deleteEntry(entry.id);
    onChanged?.();
  }

  return (
    <div className="border border-ink p-3">
      <Link href={`/review/${entry.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="font-ui text-[0.6875rem] tracking-[0.08em] text-ink-muted">
            {ymd(entry.createdAt)} · {(entry.entryType ?? "—").toUpperCase()}
          </span>
          <span className="border border-ink px-1 font-ui text-[0.625rem] tracking-[0.06em]">
            {entry.mapping ? `D${entry.mapping.domainId}` : "—"}
          </span>
        </div>
        <p className="mt-2 font-typed text-[0.875rem] leading-[1.5] text-ink">
          {snippet}
          {snippet.length >= 140 ? "…" : ""}
        </p>
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-rule-faint pt-2">
        <span className="font-ui text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
          {entry.status}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="font-ui text-[0.6875rem] uppercase tracking-[0.1em] text-ink hover:underline"
          >
            {copied ? "Copied ✓" : "Copy for Kaizen"}
          </button>
          <button
            type="button"
            onClick={() => void onDownload("md")}
            className="font-ui text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted hover:text-ink"
          >
            .md
          </button>
          <button
            type="button"
            onClick={() => void onDownload("json")}
            className="font-ui text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted hover:text-ink"
          >
            .json
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            aria-label="Delete entry"
            className="font-ui text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted hover:text-ink"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
