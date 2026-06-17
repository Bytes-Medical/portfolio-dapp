import synonymsJson from "./synonyms.json";
import { CURRICULUM, type KeyCapability } from "./curriculum";
import type { Level } from "@/lib/types";

export { allDomains, domainName, lookupCapability } from "./curriculum";
export type { KeyCapability, LearningOutcome, Domain } from "./curriculum";

const SYNONYMS = (synonymsJson as { synonyms: Record<string, string[]> }).synonyms;

/** Levels whose LOs are relevant to a trainee at `level` (specialty includes core). */
function relevantLevels(level: Level): string[] {
  return level === "core" ? ["core"] : ["core", "specialty"];
}

/**
 * Tier 1 (always included): every domain + its LOs for the trainee's level.
 * Guarantees the model sees every option (§9.3).
 */
export function buildDomainsBlock(level: Level): string {
  const levels = relevantLevels(level);
  return CURRICULUM.domains
    .map((d) => {
      const los = d.learning_outcomes
        .filter((lo) => levels.includes(lo.level))
        .map((lo) => `    ${lo.id} (${lo.level}): ${lo.text}`)
        .join("\n");
      return `D${d.id} ${d.name}\n${los}`;
    })
    .join("\n");
}

export interface RetrievedKC {
  domainId: number;
  domainName: string;
  loId: string;
  loText: string;
  kc: KeyCapability;
  score: number;
}

const WORD_RE = /[a-z][a-z'+-]*/g;
const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "was", "were", "had", "have",
  "has", "she", "her", "his", "him", "they", "them", "but", "not", "out",
  "who", "how", "all", "did", "from", "into", "about", "their", "would",
  "could", "been", "than", "then", "when", "what", "which", "your", "our",
]);

function tokenSet(text: string): Set<string> {
  const set = new Set<string>();
  for (const m of text.toLowerCase().matchAll(WORD_RE)) {
    const w = m[0];
    if (w.length >= 3 && !STOP.has(w)) set.add(w);
  }
  return set;
}

/**
 * Tier 2 (retrieved): score every candidate Key Capability by lexical overlap
 * of its keywords (expanded via synonyms.json) plus a small KC-text overlap
 * bonus; return the top K across domains (§9.3).
 */
export function retrieveKeyCapabilities(
  text: string,
  level: Level,
  k = 8,
): RetrievedKC[] {
  const lower = text.toLowerCase();
  const terms = tokenSet(text);

  // Expand query terms via synonyms whose key appears in the note.
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (lower.includes(key)) {
      for (const v of vals) for (const t of tokenSet(v)) terms.add(t);
    }
  }

  const levels = relevantLevels(level);
  const candidates: RetrievedKC[] = [];

  for (const d of CURRICULUM.domains) {
    for (const lo of d.learning_outcomes) {
      if (!levels.includes(lo.level)) continue;
      for (const kc of lo.key_capabilities) {
        let score = 0;
        for (const kw of kc.keywords) {
          const kwl = kw.toLowerCase();
          if (lower.includes(kwl)) score += 2;
          else if ([...tokenSet(kw)].some((t) => terms.has(t))) score += 1;
        }
        for (const t of tokenSet(kc.text)) if (terms.has(t)) score += 0.25;
        candidates.push({
          domainId: d.id,
          domainName: d.name,
          loId: lo.id,
          loText: lo.text,
          kc,
          score,
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.domainId - b.domainId);
  return candidates.slice(0, k);
}

/** Format retrieved KCs for the prompt. */
export function buildRetrievedBlock(retrieved: RetrievedKC[]): string {
  if (retrieved.length === 0) return "(none matched lexically)";
  return retrieved
    .map(
      (r) =>
        `D${r.domainId} ${r.domainName} > ${r.loId} > ${r.kc.id}: ${r.kc.text}`,
    )
    .join("\n");
}
