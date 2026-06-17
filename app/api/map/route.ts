import { NextResponse } from "next/server";
import { assembleSystemPrompt, buildUserPrompt } from "@/lib/rules-engine/assemble";
import { callMapping } from "@/lib/openai/client";
import type { Level, MappingResult, Overrides } from "@/lib/types";
import { ENTRY_TYPES } from "@/lib/openai/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
const MAX_TEXT = 12000;
const MAX_OVERRIDE = 8000;

function clamp01(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(1, x));
}

function sanitizeOverrides(raw: unknown): Overrides | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const pick = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.slice(0, MAX_OVERRIDE) : undefined;
  const out: Overrides = {
    mappingRules: pick(r.mappingRules),
    draftingStyle: pick(r.draftingStyle),
    redactionRules: pick(r.redactionRules),
  };
  return out.mappingRules || out.draftingStyle || out.redactionRules
    ? out
    : undefined;
}

const segments = (id: string) => (typeof id === "string" ? id.split(".").length : 0);

/** Defensively normalize the model output (§ strict-mode robustness notes). */
function normalize(result: MappingResult): MappingResult {
  const candidates = Array.isArray(result.mapping_candidates)
    ? result.mapping_candidates.slice(0, 3).map((c) => {
        // Auto-correct a swapped LO/KC pair: the KC id is more specific
        // (more dot-separated segments) than its parent LO id.
        const swapped =
          segments(c.learning_outcome_id) > segments(c.key_capability_id);
        return {
          ...c,
          learning_outcome_id: swapped ? c.key_capability_id : c.learning_outcome_id,
          key_capability_id: swapped ? c.learning_outcome_id : c.key_capability_id,
          confidence: clamp01(c.confidence),
        };
      })
    : [];
  const entryType = (ENTRY_TYPES as readonly string[]).includes(
    result.suggested_entry_type,
  )
    ? result.suggested_entry_type
    : "reflection";
  return {
    summary: typeof result.summary === "string" ? result.summary : "",
    suggested_entry_type: entryType as MappingResult["suggested_entry_type"],
    mapping_candidates: candidates,
    draft_entry: {
      what_happened: result.draft_entry?.what_happened ?? "",
      what_i_learned: result.draft_entry?.what_i_learned ?? "",
      what_i_will_do_differently:
        result.draft_entry?.what_i_will_do_differently ?? "",
    },
    pid_flags: Array.isArray(result.pid_flags) ? result.pid_flags : [],
  };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Invalid request." },
      { status: 400 },
    );
  }

  const text =
    typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  const level: Level = body.level === "specialty" ? "specialty" : "core";
  if (!text) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "No text to map." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "NO_KEY",
        message:
          "The mapping service isn't configured. Add OPENAI_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const model =
    typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
      ? body.model
      : process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini";

  const overrides = sanitizeOverrides(body.overrides);
  const nudge = typeof body.nudge === "string" ? body.nudge : undefined;
  const entryTypeHint =
    typeof body.entryTypeHint === "string" ? body.entryTypeHint : undefined;

  const system = assembleSystemPrompt({ level, text, overrides });
  const user = buildUserPrompt({ text, level, nudge, entryTypeHint });

  try {
    const result = await callMapping({ system, user, model });
    return NextResponse.json(normalize(result));
  } catch {
    // Deliberately no logging of the request body (privacy spine, §4).
    return NextResponse.json(
      {
        error: "MAPPING_FAILED",
        message:
          "Mapping failed — your note was saved. Try again, or edit and re-map.",
      },
      { status: 502 },
    );
  }
}
