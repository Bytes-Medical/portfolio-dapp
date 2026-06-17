import curriculumJson from "./curriculum.json";

export interface KeyCapability {
  id: string;
  text: string;
  keywords: string[];
}
export interface LearningOutcome {
  level: string;
  id: string;
  text: string;
  key_capabilities: KeyCapability[];
}
export interface Domain {
  id: number;
  name: string;
  learning_outcomes: LearningOutcome[];
}
export interface Curriculum {
  version: string;
  levels: string[];
  domains: Domain[];
}

export const CURRICULUM = curriculumJson as unknown as Curriculum;

/** Domain id/name list — coverage map (§8.5) and pickers. */
export function allDomains(): { id: number; name: string }[] {
  return CURRICULUM.domains.map((d) => ({ id: d.id, name: d.name }));
}

export function domainName(id: number): string {
  return CURRICULUM.domains.find((d) => d.id === id)?.name ?? `Domain ${id}`;
}

/**
 * Resolve LO / KC text from ids for display. Falls back to the id if not found
 * (the model may return ids that differ from the placeholder taxonomy).
 */
export function lookupCapability(
  domainId: number,
  loId?: string,
  kcId?: string,
): { domainName: string; loText?: string; kcText?: string } {
  const d = CURRICULUM.domains.find((x) => x.id === domainId);
  const lo = d?.learning_outcomes.find((x) => x.id === loId);
  const kc = lo?.key_capabilities.find((x) => x.id === kcId);
  return {
    domainName: d?.name ?? `Domain ${domainId}`,
    loText: lo?.text,
    kcText: kc?.text,
  };
}
