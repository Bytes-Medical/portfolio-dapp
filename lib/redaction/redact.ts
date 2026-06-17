import defaultRules from "./rules.json";

export type RedactionSource = "auto" | "flag" | "manual";

export interface RedactionSpan {
  start: number; // inclusive
  end: number; // exclusive
  type: string; // e.g. "nhs_number", "possible_name", "manual"
  token: string; // e.g. "[NHS-NO]"
  original: string; // matched substring
  source: RedactionSource;
  active: boolean; // whether currently applied
}

interface RegexRule {
  name: string;
  pattern: string;
  replacement: string;
  flags?: string;
}

export interface RulesFile {
  rules: RegexRule[];
  flag_only?: { name: string; note: string }[];
}

/** Parse owner-edited redaction rules JSON; null if invalid (caller falls back). */
export function parseRules(json: string): RulesFile | null {
  try {
    const obj = JSON.parse(json) as unknown;
    if (obj && typeof obj === "object" && Array.isArray((obj as RulesFile).rules)) {
      return obj as RulesFile;
    }
    return null;
  } catch {
    return null;
  }
}

const NAME_TITLES =
  "baby|infant|child|toddler|neonate|master|mr|mrs|ms|miss|dr|prof|sister|matron|nurse|mum|mom|mother|dad|father|son|daughter|grandmother|grandfather|aunt|uncle";

// Capitalised words that are common and almost never patient names.
const NAME_STOPWORDS = new Set(
  [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December",
    "I", "I'm", "I've", "I'll", "I'd",
    "Dr", "Mr", "Mrs", "Ms", "Miss", "Prof", "Sr", "Matron",
    "Mum", "Dad", "Mother", "Father", "Child", "Baby", "Consultant", "Registrar",
    "Reg", "Nurse", "Doctor", "Sister", "Ward", "Hospital", "Trust", "Clinic",
    "Resus", "Theatre", "Triage", "Handover", "Take",
  ].map((w) => w),
);

function buildRegex(rule: RegexRule): RegExp {
  const flags = `g${(rule.flags ?? "").replace("g", "")}`;
  return new RegExp(rule.pattern, flags);
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Pass 1 (regex → auto, active) + pass 2 (name heuristics → flag, inactive).
 * Returns non-overlapping spans sorted by position. Regex rules win over
 * heuristics; heuristics never auto-remove — the human gate decides (§11.2).
 */
export function detectRedactions(
  text: string,
  rules: RulesFile = defaultRules as RulesFile,
): RedactionSpan[] {
  const accepted: RedactionSpan[] = [];

  // Pass 1 — regex rules, applied by default.
  for (const rule of rules.rules) {
    const re = buildRegex(rule);
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const span: RedactionSpan = {
        start,
        end: start + m[0].length,
        type: rule.name,
        token: rule.replacement,
        original: m[0],
        source: "auto",
        active: true,
      };
      if (!accepted.some((a) => overlaps(a, span))) accepted.push(span);
    }
  }

  // Pass 2a — "title + Name" → flag the proper noun.
  const titleRe = new RegExp(`\\b(?:${NAME_TITLES})\\s+([A-Z][a-z]+)`, "gi");
  for (const m of text.matchAll(titleRe)) {
    const name = m[1];
    const start = (m.index ?? 0) + m[0].length - name.length;
    pushFlag(accepted, text, start, start + name.length);
  }

  // Pass 2b — capitalised, non-sentence-initial words → possible names.
  const capRe = /\b[A-Z][a-z]{1,}\b/g;
  for (const m of text.matchAll(capRe)) {
    const word = m[0];
    const start = m.index ?? 0;
    if (NAME_STOPWORDS.has(word)) continue;
    if (isSentenceInitial(text, start)) continue;
    pushFlag(accepted, text, start, start + word.length);
  }

  return accepted.sort((a, b) => a.start - b.start);
}

function pushFlag(accepted: RedactionSpan[], text: string, start: number, end: number) {
  const span: RedactionSpan = {
    start,
    end,
    type: "possible_name",
    token: "[NAME]",
    original: text.slice(start, end),
    source: "flag",
    active: false, // suggestion only
  };
  if (!accepted.some((a) => overlaps(a, span))) accepted.push(span);
}

function isSentenceInitial(text: string, start: number): boolean {
  let i = start - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  if (i < 0) return true; // start of text
  return /[.!?]/.test(text[i]);
}

/** Build the string that will actually be sent: active spans → tokens. */
export function applyRedactions(text: string, spans: RedactionSpan[]): string {
  const active = spans.filter((s) => s.active).sort((a, b) => a.start - b.start);
  let out = "";
  let i = 0;
  for (const s of active) {
    if (s.start < i) continue; // skip any overlap defensively
    out += text.slice(i, s.start) + s.token;
    i = s.end;
  }
  out += text.slice(i);
  return out;
}

export interface PlainToken {
  text: string;
  start: number;
  end: number;
  isWord: boolean;
}

/** Split a plain (un-spanned) slice into word/whitespace tokens with offsets. */
export function tokenizePlain(text: string, from: number, to: number): PlainToken[] {
  const slice = text.slice(from, to);
  const parts = slice.split(/(\s+)/).filter(Boolean);
  let pos = from;
  return parts.map((p) => {
    const tok: PlainToken = {
      text: p,
      start: pos,
      end: pos + p.length,
      isWord: /\S/.test(p),
    };
    pos += p.length;
    return tok;
  });
}

/** Trim leading/trailing non-letters so a tap redacts the word, not its punctuation. */
export function trimToWord(
  text: string,
  start: number,
  end: number,
): { start: number; end: number } {
  let s = start;
  let e = end;
  while (s < e && !/[\p{L}\p{N}]/u.test(text[s])) s++;
  while (e > s && !/[\p{L}\p{N}]/u.test(text[e - 1])) e--;
  return s < e ? { start: s, end: e } : { start, end };
}
