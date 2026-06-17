import Dexie, { type Table } from "dexie";
import type { CaptureDraft, Entry, Settings } from "@/lib/types";

/**
 * IndexedDB via Dexie. Three stores:
 *  - entries:      redacted-only committed entries (§12)
 *  - settings:     single-row app settings (§12)
 *  - captureDraft: the transient raw working draft (cleared on process)
 */
export class ByteDB extends Dexie {
  entries!: Table<Entry, string>;
  settings!: Table<Settings, string>;
  captureDraft!: Table<CaptureDraft, string>;

  constructor() {
    super("byte-portfolio");
    this.version(1).stores({
      entries: "id, createdAt, status, level, entryType",
      settings: "id",
      captureDraft: "id",
    });
  }
}

let _db: ByteDB | null = null;

/**
 * Lazy, browser-only singleton. IndexedDB does not exist during SSR, so every
 * caller runs inside a client component effect or event handler (§ gotchas).
 */
export function db(): ByteDB {
  if (typeof window === "undefined") {
    throw new Error("ByteDB is only available in the browser.");
  }
  if (!_db) _db = new ByteDB();
  return _db;
}
