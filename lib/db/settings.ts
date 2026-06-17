import { db } from "./dexie";
import type { Settings } from "@/lib/types";

const SETTINGS_ID = "app";

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  level: "core",
  model: "gpt-4o-mini",
  exportFormat: "md",
};

/** Read settings, falling back to defaults for any missing fields. */
export async function getSettings(): Promise<Settings> {
  const stored = await db().settings.get(SETTINGS_ID);
  return { ...DEFAULT_SETTINGS, ...stored, id: SETTINGS_ID };
}

/** Merge a patch over current settings and persist. */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch, id: SETTINGS_ID };
  await db().settings.put(next);
  return next;
}

/** Wipe all local data (entries, settings, capture draft). */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db().entries.clear(),
    db().settings.clear(),
    db().captureDraft.clear(),
  ]);
}
