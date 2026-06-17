import { db } from "./dexie";
import type { Entry, Level } from "@/lib/types";

export function newId(): string {
  return crypto.randomUUID();
}

/** Create a redacted-only entry (status defaults to "captured"). */
export async function createEntry(
  data: { redactedText: string; level: Level } & Partial<Entry>,
): Promise<Entry> {
  const entry: Entry = {
    status: "captured",
    ...data,
    id: data.id ?? newId(),
    createdAt: data.createdAt ?? Date.now(),
  };
  await db().entries.put(entry);
  return entry;
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  return db().entries.get(id);
}

export async function updateEntry(
  id: string,
  patch: Partial<Entry>,
): Promise<void> {
  await db().entries.update(id, patch);
}

export async function deleteEntry(id: string): Promise<void> {
  await db().entries.delete(id);
}

/** All entries, newest first. */
export async function listEntries(): Promise<Entry[]> {
  return db().entries.orderBy("createdAt").reverse().toArray();
}
