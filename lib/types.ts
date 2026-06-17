// Shared domain types for Byte Portfolio.
// Privacy invariant (§4): persisted `Entry` data is redacted-only — never raw transcript.

export type Level = "core" | "specialty";

export type EntryStatus = "captured" | "reviewed" | "exported" | "archived";

export type EntryType =
  | "reflection"
  | "mini-CEX"
  | "CbD"
  | "DOPS"
  | "leader"
  | "HAT"
  | "other";

/** The trainee's chosen mapping (the §12 persisted decision). */
export interface ChosenMapping {
  domainId: number;
  domainName: string;
  learningOutcomeId: string;
  keyCapabilityId: string;
  confidence: number;
}

/** One ranked candidate as returned by the model (§10.3, snake_case). */
export interface MappingCandidate {
  domain_id: number;
  domain_name: string;
  learning_outcome_id: string;
  key_capability_id: string;
  confidence: number;
  rationale: string;
}

/** The drafted reflective body, in the app's camelCase. */
export interface DraftEntry {
  whatHappened: string;
  whatLearned: string;
  whatNext: string;
}

/** Raw structured response from /api/map (§10.3). */
export interface MappingResult {
  summary: string;
  suggested_entry_type: EntryType;
  mapping_candidates: MappingCandidate[];
  draft_entry: {
    what_happened: string;
    what_i_learned: string;
    what_i_will_do_differently: string;
  };
  pid_flags: string[];
}

/**
 * A stored entry. Superset of §12: keeps the §12 decision fields (`mapping`,
 * `entryType`, `draft`) and adds the working data from the last /api/map call
 * (`summary`, `candidates`, …) so /review/[id] is reloadable without re-mapping.
 * Stores redacted content only.
 */
export interface Entry {
  id: string;
  createdAt: number;
  level: Level;
  status: EntryStatus;
  redactedText: string; // what was sent — already scrubbed

  // working data from the last mapping call
  summary?: string;
  candidates?: MappingCandidate[];
  suggestedEntryType?: EntryType;
  pidFlags?: string[];
  nudge?: string;

  // the trainee's decisions
  mapping?: ChosenMapping;
  entryType?: EntryType;
  draft?: DraftEntry;
  editedByUser?: boolean;
  exportedAt?: number;
}

export interface Overrides {
  mappingRules?: string;
  draftingStyle?: string;
  redactionRules?: string;
}

export interface Settings {
  id: string; // singleton key, always "app"
  level: Level;
  model: "gpt-4o-mini" | "gpt-4o";
  exportFormat: "md" | "json";
  overrides?: Overrides;
}

/**
 * The in-progress capture draft. This is the ONLY place raw (pre-redaction) text
 * is persisted, kept deliberately separate from the redacted-only `entries` store
 * and wiped the moment a note is processed (§8.1 "autosave draft"; reconciled with
 * §4 by isolation + eager clearing). Cleared by "clear all local data".
 */
export interface CaptureDraft {
  id: string; // singleton key, always "current"
  text: string;
  level: Level;
  updatedAt: number;
}
