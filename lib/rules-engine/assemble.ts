import {
  DEFAULT_DRAFTING_STYLE,
  DEFAULT_ENTRY_TEMPLATES,
  DEFAULT_MAPPING_RULES,
} from "./defaults";
import {
  buildDomainsBlock,
  buildRetrievedBlock,
  retrieveKeyCapabilities,
} from "./retrieve";
import type { Level, Overrides } from "@/lib/types";

/** Assemble the system prompt (§10.4), applying owner overrides over defaults. */
export function assembleSystemPrompt({
  level,
  text,
  overrides,
}: {
  level: Level;
  text: string;
  overrides?: Overrides;
}): string {
  const domains = buildDomainsBlock(level);
  const retrieved = buildRetrievedBlock(retrieveKeyCapabilities(text, level));
  const mappingRules = overrides?.mappingRules?.trim() || DEFAULT_MAPPING_RULES;
  const draftingStyle = overrides?.draftingStyle?.trim() || DEFAULT_DRAFTING_STYLE;

  return `You map a UK paediatric trainee's anonymised learning note to the RCPCH
Progress+ curriculum and draft a reflective entry. You never output any
patient-identifying detail; if any remains, replace it with a placeholder
and note it in pid_flags.

TRAINEE LEVEL: ${level}

CURRICULUM (authoritative — map only within these; use these exact ids):
${domains}

CANDIDATE KEY CAPABILITIES (retrieved — likely matches, but you may map to any above):
${retrieved}

MAPPING RULES (owner-specified — follow exactly):
${mappingRules}

ENTRY FORMAT:
${DEFAULT_ENTRY_TEMPLATES}

DRAFTING STYLE:
${draftingStyle}

Return ONLY the JSON object matching the schema. Map to the lowest level
(Key Capability), using ids that exist in the curriculum above. Get the two id
fields the right way round: learning_outcome_id is the PARENT LO id (e.g. "10.C");
key_capability_id is the MORE SPECIFIC child id with an extra segment
(e.g. "10.C.1"). domain_name must be the domain's name (e.g. "Education and
training"), not the LO text. Give between 1 and 3 candidates (no more than 3),
ranked by descending confidence in [0,1], each with a one-line rationale. Draft
in the trainee's first person, anonymised.`;
}

/** Build the user message: the redacted note + level + optional nudges. */
export function buildUserPrompt({
  text,
  level,
  nudge,
  entryTypeHint,
}: {
  text: string;
  level: Level;
  nudge?: string;
  entryTypeHint?: string;
}): string {
  const parts = [`TRAINEE LEVEL: ${level}`, "", "ANONYMISED NOTE:", text];
  if (entryTypeHint) {
    parts.push("", `PREFERRED ENTRY TYPE (hint): ${entryTypeHint}`);
  }
  if (nudge && nudge.trim()) {
    parts.push("", `RE-MAP GUIDANCE FROM TRAINEE: ${nudge.trim()}`);
  }
  return parts.join("\n");
}
