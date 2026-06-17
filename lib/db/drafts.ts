import { db } from "./dexie";
import type { CaptureDraft, Level } from "@/lib/types";

const DRAFT_ID = "current";

/** The transient raw capture draft (survives reload; cleared on process). */
export async function getDraft(): Promise<CaptureDraft | undefined> {
  return db().captureDraft.get(DRAFT_ID);
}

export async function saveDraft(text: string, level: Level): Promise<void> {
  const draft: CaptureDraft = {
    id: DRAFT_ID,
    text,
    level,
    updatedAt: Date.now(),
  };
  await db().captureDraft.put(draft);
}

export async function clearDraft(): Promise<void> {
  await db().captureDraft.delete(DRAFT_ID);
}
