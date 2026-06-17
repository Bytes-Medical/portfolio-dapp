import type { Level, MappingResult, Overrides } from "@/lib/types";

const FALLBACK_MESSAGE =
  "Mapping failed — your note was saved. Try again, or edit and re-map.";

/** Client-side caller for /api/map. Sends redacted text only. */
export async function requestMapping(input: {
  text: string;
  level: Level;
  model?: string;
  nudge?: string;
  entryTypeHint?: string;
  overrides?: Overrides;
}): Promise<MappingResult> {
  const res = await fetch("/api/map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = FALLBACK_MESSAGE;
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) message = j.message;
    } catch {
      /* keep fallback */
    }
    throw new Error(message);
  }
  return (await res.json()) as MappingResult;
}
