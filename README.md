# byte portfolio

A minute of talking in. A curriculum-mapped portfolio entry out.

Single-user web app: capture a clinical learning moment as text, redact patient
identifiers **in the browser**, send only the redacted text to a server route that
calls OpenAI, get a structured RCPCH Progress+ mapping + drafted reflection, review,
and export a Kaizen-ready block. Everything persists locally (IndexedDB). No PID ever
leaves the device. Built to `spec.md` (milestones M1–M8).

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) ·
OpenAI (`gpt-4o-mini` default) · Courier Prime + JetBrains Mono.

## Run
```bash
npm install
cp .env.example .env.local   # then add your key
npm run dev                  # http://localhost:3000
```

`.env.local`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL_DEFAULT=gpt-4o-mini
```
The key is read **only** in `app/api/map/route.ts` (server-side). Without it the app
runs and is fully navigable; mapping shows a clear "not configured" message.

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build (also type-checks)
- `npm run typecheck` — `tsc --noEmit`
- `npm start` — serve the production build

## Two things to supply
1. **Curriculum** — `lib/rules-engine/curriculum.json` is a schema-valid **placeholder**.
   Replace it wholesale with the authoritative RCPCH Progress+ taxonomy (all 11 domains
   + LO/KC text). The shape matches spec §9.2, so it's a clean drop-in swap.
2. **OpenAI key** — see above.

## Privacy spine (non-negotiable)
- Redaction runs client-side and **blocks** the network call (`components/RedactionGate.tsx`).
- The request body to `/api/map` contains only redacted text; the key never reaches the client.
- The `entries` store holds redacted content only. The raw capture draft lives in a
  separate, transient `captureDraft` store and is cleared the moment a note is processed.

## Map
```
app/(marketing)/page.tsx        landing (§7)
app/(app)/capture               capture + redaction gate
app/(app)/review/[id]           review mapping + draft, accept/re-map/discard
app/(app)/inbox                 list/search/filter + Kaizen export
app/(app)/coverage              domain coverage matrix
app/(app)/settings              rules editor, level/model toggles, clear data
app/api/map/route.ts            OpenAI proxy (server-only key)
lib/redaction                   client-side redaction engine
lib/rules-engine                curriculum + lexical retrieval + prompt assembly + rule defaults
lib/openai                      schema + client
lib/db                          Dexie stores (entries, settings, captureDraft)
lib/export                      Kaizen markdown/JSON
```

> A drafting aid, not an official ePortfolio. Reflections must be anonymised.
