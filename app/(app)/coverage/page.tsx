"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/PageHeading";
import { listEntries } from "@/lib/db/entries";
import { allDomains } from "@/lib/rules-engine/curriculum";
import type { Entry } from "@/lib/types";

const BAR_MAX = 22;

export default function CoveragePage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const e = await listEntries();
      if (active) setEntries(e);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (entries === null) {
    return (
      <div>
        <PageHeading eyebrow="Coverage" title="Domain coverage" />
        <p className="font-ui text-[0.875rem] text-ink-muted">Loading…</p>
      </div>
    );
  }

  const counts = new Map<number, number>();
  for (const e of entries) {
    if (e.mapping) counts.set(e.mapping.domainId, (counts.get(e.mapping.domainId) ?? 0) + 1);
  }
  const domains = allDomains();
  const max = Math.max(1, ...domains.map((d) => counts.get(d.id) ?? 0));
  const totalMapped = [...counts.values()].reduce((a, b) => a + b, 0);
  const thin = domains.filter((d) => (counts.get(d.id) ?? 0) === 0);

  return (
    <div className="pb-8">
      <PageHeading eyebrow="Coverage" title="Domain coverage">
        Where your logged entries land across the 11 Progress+ domains.
      </PageHeading>

      <div className="border border-ink">
        {domains.map((d, i) => {
          const count = counts.get(d.id) ?? 0;
          const cells = count === 0 ? 0 : Math.max(1, Math.round((count / max) * BAR_MAX));
          const isThin = count === 0;
          return (
            <div
              key={d.id}
              className={`px-3 py-2.5 ${i > 0 ? "border-t border-rule-faint" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2 font-ui text-[0.8125rem]">
                <span className="min-w-0 truncate">
                  <span className="text-ink-muted">D{d.id}</span>{" "}
                  <span className="text-ink">{d.name}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  {isThin ? (
                    <span className="text-[0.625rem] uppercase tracking-[0.08em] text-accent-ink">
                      thin
                    </span>
                  ) : null}
                  <span className="tabular-nums text-ink">{count}</span>
                </span>
              </div>
              <div
                className="mt-1 overflow-hidden whitespace-nowrap font-typed text-[0.9375rem] leading-none"
                aria-hidden="true"
              >
                <span className="text-accent">{"▰".repeat(cells)}</span>
                {count === 0 ? <span className="text-ink-faint">·</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 max-w-xl font-typed text-[0.875rem] text-ink-muted">
        {totalMapped === 0
          ? "No mapped entries yet. Capture and accept a few — coverage builds here."
          : thin.length === 0
            ? "Every domain has at least one entry. Nicely spread."
            : `You're light on ${thin.map((d) => d.name).join(", ")}.`}
      </p>
    </div>
  );
}
