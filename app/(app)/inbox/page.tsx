"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { EntryCard } from "@/components/EntryCard";
import { PageHeading } from "@/components/PageHeading";
import { listEntries } from "@/lib/db/entries";
import { allDomains } from "@/lib/rules-engine/curriculum";
import { ENTRY_TYPES } from "@/lib/openai/schema";
import type { Entry } from "@/lib/types";

const STATUSES = ["captured", "reviewed", "exported", "archived"] as const;

const selectCls =
  "border border-ink bg-paper px-2 py-2 font-ui text-[0.75rem] uppercase tracking-[0.06em] text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink";

export default function InboxPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const refresh = useCallback(async () => {
    setEntries(await listEntries());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (domain !== "all" && String(e.mapping?.domainId ?? "") !== domain)
        return false;
      if (type !== "all" && (e.entryType ?? "") !== type) return false;
      if (status !== "all" && e.status !== status) return false;
      if (needle) {
        const hay = [
          e.redactedText,
          e.draft?.whatHappened,
          e.draft?.whatLearned,
          e.draft?.whatNext,
          e.mapping?.domainName,
          e.entryType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [entries, q, domain, type, status]);

  return (
    <div className="pb-8">
      <PageHeading eyebrow="Inbox" title="Captured entries" />

      {/* Search + filters */}
      <div className="space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entries…"
          className="w-full border-b border-ink bg-paper py-2 font-typed text-[0.9375rem] text-ink placeholder:text-ink-faint focus:outline-none"
          aria-label="Search entries"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={selectCls}
            aria-label="Filter by domain"
          >
            <option value="all">All domains</option>
            {allDomains().map((d) => (
              <option key={d.id} value={String(d.id)}>
                D{d.id} {d.name}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectCls}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectCls}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {entries === null ? (
          <p className="font-ui text-[0.875rem] text-ink-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={entries.length > 0} />
        ) : (
          filtered.map((e) => (
            <EntryCard key={e.id} entry={e} onChanged={() => void refresh()} />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="border border-rule-faint p-6 text-center">
      <p className="font-typed text-[0.9375rem] text-ink-muted">
        {hasAny ? "No entries match these filters." : "No entries yet."}
      </p>
      {!hasAny ? (
        <div className="mt-4 flex justify-center">
          <Button href="/">Capture a moment</Button>
        </div>
      ) : null}
    </div>
  );
}
