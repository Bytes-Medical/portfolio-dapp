import { lookupCapability } from "@/lib/rules-engine/curriculum";
import { ymd } from "@/lib/format";
import type { Entry } from "@/lib/types";

const PAD = 18;

/** The paste-ready Kaizen block (§13). */
export function toKaizenMarkdown(entry: Entry): string {
  const type = (entry.entryType ?? "reflection").toUpperCase();
  const m = entry.mapping;
  const look = m
    ? lookupCapability(m.domainId, m.learningOutcomeId, m.keyCapabilityId)
    : null;
  const d = entry.draft ?? { whatHappened: "", whatLearned: "", whatNext: "" };

  const row = (label: string, value: string) => `${`${label}:`.padEnd(PAD)}${value}`;

  return [
    `RCPCH PROGRESS+  ·  ${type}`,
    row("Domain", m ? `${m.domainId} — ${m.domainName}` : "[unmapped]"),
    row(
      "Learning outcome",
      m ? `${m.learningOutcomeId}${look?.loText ? ` — ${look.loText}` : ""}` : "[unmapped]",
    ),
    row(
      "Key capability",
      m ? `${m.keyCapabilityId}${look?.kcText ? ` — ${look.kcText}` : ""}` : "[unmapped]",
    ),
    "",
    "What happened",
    d.whatHappened,
    "",
    "What I learned",
    d.whatLearned,
    "",
    "What I will do differently",
    d.whatNext,
  ].join("\n");
}

/** Structured export of an entry (redacted-only). */
export function toKaizenJSON(entry: Entry): string {
  return JSON.stringify(
    {
      type: entry.entryType ?? "reflection",
      createdAt: new Date(entry.createdAt).toISOString(),
      mapping: entry.mapping ?? null,
      draft: entry.draft ?? null,
      redactedText: entry.redactedText,
    },
    null,
    2,
  );
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Suggested filename stem for an entry export. */
export function exportName(entry: Entry): string {
  const dom = entry.mapping ? `d${entry.mapping.domainId}` : "unmapped";
  return `byte-${ymd(entry.createdAt)}-${dom}`;
}
