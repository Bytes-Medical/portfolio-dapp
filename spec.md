# BYTE PORTFOLIO — BUILD SPECIFICATION v1

```
A minute of talking in. A curriculum-mapped portfolio entry out.
```

**Owner:** Dr Akanimoh Osutuk · **Brand:** Bytes ecosystem (sibling to Bytes Teaching)
**Target:** Web app (v1) · Next.js · OpenAI API · rules-grounded mapping
**Curriculum basis:** RCPCH Progress+ (live since 1 Aug 2023)
**Status:** Build-ready — hand to Claude Code milestone by milestone (§16)

---

## 0. How to read this document

This is the authoritative build spec. Sections 1–4 fix scope and architecture. Section 5 is the design system. Sections 6–7 are the pages. Sections 8–13 are the engine (rules-RAG, OpenAI, redaction, data). Sections 14–16 are repo structure, config, and the milestone plan with acceptance criteria. Build in milestone order; each milestone is independently testable.

---

## 1. v1 scope (what we are building now)

A **single-user web app**, no login, that:

1. Lets a trainee **capture** a learning moment as text (typed, or via the device keyboard's dictate key).
2. **Redacts** patient-identifiable data (PID) client-side, with a confirm gate.
3. Sends **only redacted text** to a server route that calls the **OpenAI API**.
4. Receives a **structured mapping** (RCPCH Progress+ Domain → Learning Outcome → Key Capability) + a **drafted reflective entry**, grounded by a **rules pack the owner edits**.
5. Lets the trainee **review, edit, accept**, then **export** a Kaizen-ready block.
6. Stores everything **locally** (IndexedDB). No PID ever persists; no backend database in v1.

Out of scope for v1: accounts, cloud sync, in-app audio recording/Whisper, native apps, supervisor views, direct Kaizen API integration. All flagged for later (§17).

---

## 2. Architecture (v1)

```
┌─────────────────────────── BROWSER (client) ───────────────────────────┐
│  Capture (text)  →  Redaction engine  →  Confirm gate                   │
│        │                  │                                              │
│        ▼                  ▼                                              │
│   IndexedDB (Dexie)   redacted text ──────────────┐                     │
│   (redacted only)                                  │                     │
└────────────────────────────────────────────────────┼────────────────────┘
                                                      │  redacted text only
                                                      ▼
┌─────────────────── NEXT.JS SERVER (route handler) ──────────────────────┐
│  /api/map  →  rules-RAG assembly  →  OpenAI (gpt-4o-mini)  →  JSON       │
│  (OPENAI_API_KEY lives here, never on client)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Privacy invariant (non-negotiable):** raw input is never transmitted. The redaction pass runs in the browser; the network request body contains only scrubbed text. The OpenAI key lives only in the server route. This is the product's spine and its main trust claim — say it on the landing page.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router), TypeScript** | RSC where useful; route handler for OpenAI proxy |
| Styling | **Tailwind CSS** + CSS variables for tokens | Tokens in `globals.css` (§5) |
| Fonts | **Courier Prime** (typed surfaces) + **JetBrains Mono** (UI/chrome) | Google Fonts via `next/font` |
| LLM | **OpenAI API**, `gpt-4o-mini` default (`gpt-4o` toggle) | Structured Outputs (json_schema, strict) |
| Capture | Native `<textarea>` + OS keyboard dictation | No audio in v1 |
| Redaction | Client-side: regex + heuristics + confirm gate | `lib/redaction` |
| Rules-RAG | Local files + lexical retrieval | `lib/rules-engine` |
| Storage | **IndexedDB via Dexie** | redacted entries only |
| Export | Clipboard + `.md`/`.json` download | `lib/export` |
| Hosting | Vercel | one env var: `OPENAI_API_KEY` |

---

## 4. The privacy spine, reconciled with web + OpenAI

The earlier strategic spec set "PID never leaves the device" as the spine. Here is exactly how v1 honours it despite needing a server proxy for the API key:

- **No audio.** Capture is text. The keyboard dictate key produces text at the OS level; the app only ever holds text.
- **Redaction is client-side and blocking.** The mapping request cannot fire until the user passes the redaction confirm gate.
- **The server is a thin proxy.** It receives already-redacted text, assembles the prompt, calls OpenAI, returns JSON. It writes nothing to disk and logs no request bodies.
- **The model is instructed to emit no identifiers** even if any slip through — belt and braces.
- **At-rest = redacted only.** IndexedDB stores the redacted transcript, the mapping, and the draft. The raw transcript exists only transiently in component state and is overwritten on save.

State this plainly to users; do not over-claim ("we can't see your patients" is true and is the selling point).

---

## 5. Design system — "Carbon Copy"

Pure black ink on paper white. Everything monospaced. The page should feel like a typewriter and a stack of carbon-copy forms — physical, exact, quiet. The boldness lives in **one** place: the living typed surface (blinking caret + carbon-copy entry rendering). Everything else stays disciplined.

### 5.1 Tokens (`globals.css`)

```css
:root {
  /* Ink & paper — strict black/white */
  --paper:        #FFFFFF;
  --ink:          #141414;   /* dense typewriter black */
  --ink-muted:    #6B6B6B;   /* secondary text */
  --ink-faint:    #9A9A9A;   /* placeholders, meta */
  --rule:         #141414;   /* solid 1px borders */
  --rule-faint:   #D8D8D8;   /* dotted leaders, hairlines */
  --inverse-bg:   #141414;   /* emphasis / primary buttons */
  --inverse-fg:   #FFFFFF;

  /* Type */
  --font-typed:   "Courier Prime", "Courier New", monospace; /* typed surfaces, hero */
  --font-ui:      "JetBrains Mono", ui-monospace, monospace;  /* labels, nav, tables */

  /* Scale (rem) */
  --t-hero: 2.25rem; --t-h1: 1.625rem; --t-h2: 1.25rem;
  --t-body: 1rem;    --t-sm: 0.8125rem; --t-label: 0.6875rem;

  /* Rhythm */
  --lh: 1.65;            /* generous, typed-page feel */
  --measure: 42rem;      /* reading column max-width */
  --space: 8px;          /* base unit; use multiples */
}
@media (prefers-reduced-motion: reduce) { /* caret is solid, no reveal */ }
```

No accent colour. Emphasis comes only from: **inverse blocks**, **bold weight**, **underline**, and the **caret**. No border-radius anywhere (`border-radius: 0`). No shadows except a single hard 2px offset on the primary CTA if needed.

### 5.2 Typography rules

- Two monospace faces only. **Courier Prime** = anything the user "types" or that represents typed output (hero headline, capture textarea, the rendered entry). **JetBrains Mono** = chrome (nav, labels, buttons, tables, captions).
- **Labels** are uppercase, `letter-spacing: 0.12em`, `--t-label`, `--ink-muted`.
- Body line-height `--lh`; paragraphs left-aligned, never justified.
- Headlines sentence case in Courier Prime; let the monospace do the work, no decorative weights.

### 5.3 Signature elements (spend boldness here)

1. **The block caret `▋`** — a blinking block cursor that lives at the end of the hero headline and in the capture surface. Solid (non-blinking) under reduced-motion. It is the brand's heartbeat.
2. **Carbon-copy entry rendering** — a saved/drafted entry renders as a typed memo: a header block of dotted-leader form rows, then the reflective body in Courier Prime, faintly offset like a carbon duplicate.

```
┌──────────────────────────────────────────────┐
│ BYTE PORTFOLIO · ENTRY                         │
│ DATE ........................ 2026-06-14       │
│ TYPE ........................ REFLECTION        │
│ DOMAIN ...................... 10 · EDUCATION    │
│ OUTCOME ..................... [confirmed]       │
│ ──────────────────────────────────────────────│
│ What happened                                  │
│ …typed body…                                   │
└──────────────────────────────────────────────┘
```

3. **Dotted-leader form rows** — `LABEL ......... value` (the structural device; it encodes that this is a *form being filled*, which is literally true). Use sparingly, only for true field/value pairs.

### 5.4 Components

- **Button (primary):** inverse block, `[ DICTATE ]`-style uppercase label, JetBrains Mono, 1px ink border, no radius; hover = invert back to paper with ink border.
- **Button (ghost):** paper bg, ink border, uppercase label.
- **Input/textarea:** no box; a single bottom rule (`--rule`) or a full 1px ink border for the capture surface; caret styled as block where possible.
- **Card / panel:** 1px solid `--rule`, no radius, internal padding `3×--space`.
- **Divider:** a typed rule line — `────────` or a 1px `--rule-faint` hairline.
- **Tag (domain):** `[ D10 ]` bracketed monospace chip, ink border.
- **Nav:** top bar, left wordmark `byte portfolio` lowercase Courier Prime, right links uppercase JetBrains Mono labels.

### 5.5 Motion

Minimal and earned: caret blink (1s steps), one typed-reveal on the hero headline only, hover invert on buttons. Nothing else. Respect `prefers-reduced-motion`.

### 5.6 Quality floor

Responsive to 360px, visible keyboard focus (`outline: 2px solid var(--ink)`), reduced-motion respected, sufficient contrast (strict B&W passes AAA easily). Mobile-first — this is a phone-in-hand tool.

---

## 6. Information architecture

```
/                 Landing (marketing)
/capture          Capture a moment
/review/[id]      Review mapping + draft, edit, accept
/inbox            All captured entries; search, filter, export
/coverage         Domain coverage map (what's thin)
/settings         Rules editor (owner-editable), training level, model toggle
```

Bottom tab bar on mobile (Capture · Inbox · Coverage · Settings); the big primary action everywhere is **Capture**.

---

## 7. Landing page spec (`/`)

Single scroll, typewriter voice throughout. The hero is the thesis: a typed sentence completing itself.

**7.1 Nav** — wordmark `byte portfolio` left; right: `HOW IT WORKS`, `PRIVACY`, `[ OPEN APP ]` (inverse).

**7.2 Hero**
- Headline in Courier Prime, large, with the block caret typing it out:
  `You saw something worth keeping.▋`
- Subhead (JetBrains Mono, muted): "Capture a clinical learning moment by voice or text in a minute. Byte Portfolio maps it to RCPCH Progress+ and drafts the entry. You review and paste it into Kaizen."
- Primary CTA `[ CAPTURE A MOMENT ]` → `/capture`. Secondary ghost `SEE HOW IT WORKS`.

**7.3 The problem** — three short typed lines, dotted-leader styling:
`THE MOMENT ......... 3am, on take`
`THE PORTFOLIO ...... a desk you'll reach in 4 days`
`THE RESULT ......... great work, unlogged`
Caption: "Under-logging isn't a motivation problem. It's friction and timing. Byte Portfolio removes both."

**7.4 How it works** — three steps (numbered here because it *is* a sequence):
`01 SPEAK` — talk or type for a minute while it's fresh.
`02 MAP` — it proposes the Progress+ domain, outcome and key capability.
`03 KEEP` — review, accept, and paste into Kaizen.

**7.5 Privacy panel** (the trust headline, inverse block):
"Nothing identifiable leaves your device. Capture stays as text, patient details are scrubbed on your phone before anything is sent, and entries live locally. We can't see your patients — by design."

**7.6 Who it's for** — paediatric trainees on RCPCH Progress+ (ST1–ST7); SAS/MTI; expandable to other colleges.

**7.7 Ecosystem** — one line: "Part of the Bytes family, alongside Bytes Teaching."

**7.8 Final CTA + footer** — `[ START CAPTURING ]`; footer: brand, a short IG/disclaimer note ("A drafting aid, not an official ePortfolio. Reflections must be anonymised."), year.

Copy register: plain, exact, no marketing fluff; sentence case; verbs that say what happens.

---

## 8. App screens

### 8.1 `/capture`
- Full-height Courier Prime textarea, placeholder: `Start typing — or tap the dictate key on your keyboard. ▋`
- Word/seconds hint, muted. Optional training-level pill (Core / Specialty) pulled from settings.
- Primary `[ PROCESS ]` (disabled until non-empty). On press → run redaction → go to confirm gate.
- Autosave draft to IndexedDB on blur.

### 8.2 Redaction confirm gate (modal/route step)
- Shows the text with flagged spans visibly **struck and replaced** (`[CHILD]`, `[AGE]`, `[NHS-NO]`, `[UNIT]`).
- User can tap any word to redact it manually, or restore a false-positive.
- Copy: "Check nothing identifies a patient. This is what will be sent." Blocking `[ CONFIRM & MAP ]`.
- Only on confirm does `/api/map` fire with the redacted string.

### 8.3 `/review/[id]`
- Renders as the carbon-copy memo (§5.3).
- **Mapping candidates:** top 1–3, each `[ D10 ] EDUCATION AND TRAINING ▸ <LO> ▸ <Key Capability>` with a confidence bar (monospace `▰▰▰▱▱`) and a one-line rationale. User selects one (radio).
- **Entry type** selector (Reflection default; SLE types flagged "needs supervisor").
- **Draft body:** editable Courier Prime fields — What happened / What I learned / What I'll do differently.
- Actions: `[ ACCEPT ]` (saves status=reviewed), `[ RE-MAP ]` (re-runs with a nudge field), `[ DISCARD ]`.

### 8.4 `/inbox`
- List of entries (carbon-copy mini-cards): date, domain tag, type, status (`captured` / `reviewed` / `exported`).
- Search + filter by domain/type/status. Tap → review. Per-entry `[ COPY FOR KAIZEN ]`.

### 8.5 `/coverage`
- A monospace matrix: 11 domains down the side, entry counts as typed bars. Thin domains flagged `← thin`. This is the retention loop: "you're light on Research and scholarship."

### 8.6 `/settings`
- **Rules editor** (the owner's control surface — see §9.4): editable text areas bound to `mapping-rules.md`, `drafting-style.md`, and redaction rules, persisted to IndexedDB and sent with each request (so *you* tune behaviour without redeploying).
- Training level (Core/Specialty), sub-specialty (later), model toggle (`gpt-4o-mini` / `gpt-4o`), export format default, "clear all local data."

---

## 9. The rules-RAG engine ("makeshift RAG, owner-specified")

No vector DB. A small, **owner-editable rules pack** is the grounding, combined with **lexical retrieval** to keep prompts tight and accurate. The owner specifies the rules; the engine assembles them.

### 9.1 Pack files (`lib/rules-engine/`)

```
curriculum.json        Canonical Progress+ taxonomy (authoritative; load real data)
mapping-rules.md       Owner-written heuristics ("teaching students → D10", do/don't)
entry-templates.md     Reflective format + per-entry-type rules
drafting-style.md      Voice/tone for drafted reflections (anonymised, first person)
synonyms.json          Keyword → domain/LO hints for lexical retrieval
```

### 9.2 `curriculum.json` shape

```json
{
  "version": "progress-plus-2023",
  "levels": ["core", "specialty"],
  "domains": [
    {
      "id": 1, "name": "Professional values and behaviours",
      "learning_outcomes": [
        { "level": "core", "id": "1.C",
          "text": "…LO standard text…",
          "key_capabilities": [
            { "id": "1.C.1", "text": "…", "keywords": ["consent","safeguarding"] }
          ] }
      ]
    }
    /* … all 11 domains. Pull the authoritative list/text from the RCPCH
       Progress+ syllabi before build — do not hardcode from memory. */
  ]
}
```

Confirmed anchors to seed against: D1 Professional values and behaviours, D10 Education and training, D11 Research and scholarship; plus Procedures, Communication, Leadership and team working. **Populate all 11 + LO/KC text from the official syllabi.**

### 9.3 Retrieval strategy (lexical, two-tier)

1. **Always include** in the prompt: the full domain list + each domain's LO for the user's level (small, ~1–2k tokens). This guarantees the model sees every option.
2. **Retrieve** the bulky specifics — candidate **Key Capabilities** + matching **mapping-rule snippets** — by lexical match: tokenise the redacted text, match against `keywords`/`synonyms.json`, score (simple term-frequency overlap), take top-K (e.g. 8) KCs across domains. Inject those.
3. Always include `mapping-rules.md`, `entry-templates.md`, `drafting-style.md` verbatim (they're short and owner-authoritative).

This is the "makeshift RAG": small authoritative core, lexically-retrieved specifics, owner-written rules as the steering layer. Upgrade path: swap lexical scoring for embeddings later without changing the contract.

### 9.4 Owner control

`mapping-rules.md`, `drafting-style.md`, and redaction rules are editable in `/settings` and override the file defaults at request time. This is how the owner "specifies the rules" live.

---

## 10. OpenAI integration (`/api/map`, `lib/openai/`)

### 10.1 Route contract

`POST /api/map`
Request body (already redacted): `{ text, level, entryTypeHint?, nudge?, overrides? }`
Response: the structured JSON below.

Server steps: validate → assemble prompt (system = assembled rules pack; user = redacted text + level + optional nudge) → call OpenAI with strict Structured Outputs → return parsed JSON. No logging of bodies.

### 10.2 Model + call

- Model: `gpt-4o-mini` (default), `gpt-4o` (settings toggle).
- `response_format: { type: "json_schema", json_schema: { name: "mapping", strict: true, schema: {…§10.3…} } }`
- `temperature: 0.3` (deterministic-ish mapping; drafting still natural).

### 10.3 Output JSON schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["summary","suggested_entry_type","mapping_candidates","draft_entry","pid_flags"],
  "properties": {
    "summary": { "type": "string" },
    "suggested_entry_type": {
      "type": "string",
      "enum": ["reflection","mini-CEX","CbD","DOPS","leader","HAT","other"]
    },
    "mapping_candidates": {
      "type": "array", "minItems": 1, "maxItems": 3,
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["domain_id","domain_name","learning_outcome_id","key_capability_id","confidence","rationale"],
        "properties": {
          "domain_id": { "type": "integer" },
          "domain_name": { "type": "string" },
          "learning_outcome_id": { "type": "string" },
          "key_capability_id": { "type": "string" },
          "confidence": { "type": "number" },
          "rationale": { "type": "string" }
        }
      }
    },
    "draft_entry": {
      "type": "object", "additionalProperties": false,
      "required": ["what_happened","what_i_learned","what_i_will_do_differently"],
      "properties": {
        "what_happened": { "type": "string" },
        "what_i_learned": { "type": "string" },
        "what_i_will_do_differently": { "type": "string" }
      }
    },
    "pid_flags": { "type": "array", "items": { "type": "string" } }
  }
}
```

### 10.4 System prompt template (assembled server-side)

```
You map a UK paediatric trainee's anonymised learning note to the RCPCH
Progress+ curriculum and draft a reflective entry. You never output any
patient-identifying detail; if any remains, replace it with a placeholder
and note it in pid_flags.

TRAINEE LEVEL: {level}

CURRICULUM (authoritative — map only within these):
{domains + LOs for level}
CANDIDATE KEY CAPABILITIES (retrieved):
{retrieved KCs}

MAPPING RULES (owner-specified — follow exactly):
{mapping-rules.md (+ overrides)}

ENTRY FORMAT:
{entry-templates.md}

DRAFTING STYLE:
{drafting-style.md}

Return ONLY the JSON object matching the schema. Map to the lowest level
(Key Capability). Give 1–3 candidates ranked by confidence with a one-line
rationale each. Draft in the trainee's first person, anonymised.
```

### 10.5 Errors

Typed, in-voice: on failure show `MAPPING FAILED — the note was saved. Try again, or edit and re-map.` Never lose the user's text (it's already in IndexedDB).

---

## 11. Redaction engine (`lib/redaction/`)

Client-side, runs before any network call. Two passes + a human gate.

### 11.1 `redaction-rules.json`

```json
{
  "rules": [
    { "name": "nhs_number", "pattern": "\\b\\d{3}\\s?\\d{3}\\s?\\d{4}\\b", "replacement": "[NHS-NO]" },
    { "name": "dob", "pattern": "\\b\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}\\b", "replacement": "[DATE]" },
    { "name": "age", "pattern": "\\b\\d{1,2}[- ]?(year|yr|month|mo|week|day)s?[- ]?old\\b", "replacement": "[AGE]", "flags": "i" },
    { "name": "postcode", "pattern": "\\b[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}\\b", "replacement": "[POSTCODE]", "flags": "i" },
    { "name": "phone", "pattern": "\\b(0\\d{9,10})\\b", "replacement": "[PHONE]" }
  ],
  "flag_only": [
    { "name": "possible_name", "note": "capitalised mid-sentence tokens, titles (baby/child/Mr/Mrs/Dr + Name)" }
  ]
}
```

### 11.2 Pipeline

1. **Regex pass** — apply all `rules`, replacing matches with tokens.
2. **Heuristic flagging** — mark likely names/identifiers (`flag_only`) as *suggestions* (not auto-removed) so the user decides.
3. **Confirm gate (§8.2)** — the user reviews struck/replaced text, can redact more or restore false positives. This human step is the real guarantee; regex alone is not trusted for names.

Honest limitation to encode in copy: automated name detection is imperfect, which is why the confirm gate is mandatory and the model is also instructed to emit nothing identifiable.

---

## 12. Data model (IndexedDB via Dexie)

```ts
// redacted content only — never store raw transcript or PID
interface Entry {
  id: string;                 // uuid
  createdAt: number;
  level: "core" | "specialty";
  status: "captured" | "reviewed" | "exported" | "archived";
  redactedText: string;       // what was sent
  mapping?: {
    domainId: number; domainName: string;
    learningOutcomeId: string; keyCapabilityId: string;
    confidence: number;
  };
  entryType?: string;
  draft?: { whatHappened: string; whatLearned: string; whatNext: string };
  editedByUser?: boolean;
  exportedAt?: number;
}
interface Settings {
  level: "core" | "specialty";
  model: "gpt-4o-mini" | "gpt-4o";
  overrides?: { mappingRules?: string; draftingStyle?: string; redactionRules?: string };
}
```

Raw transcript lives only in transient React state and is dropped on save.

---

## 13. Export (`lib/export/toKaizen.ts`)

v1 = a clean, paste-ready block + `.md`/`.json` download. Format so the trainee can select the right Kaizen dropdowns in one pass:

```
RCPCH PROGRESS+  ·  REFLECTION
Domain:          10 — Education and training
Learning outcome: {id} — {text}
Key capability:   {id} — {text}

What happened
{…}

What I learned
{…}

What I will do differently
{…}
```

`[ COPY FOR KAIZEN ]` copies this; mark entry `exported`.

---

## 14. Repository structure

```
byte-portfolio/
├─ app/
│  ├─ (marketing)/page.tsx        # landing (§7)
│  ├─ capture/page.tsx
│  ├─ review/[id]/page.tsx
│  ├─ inbox/page.tsx
│  ├─ coverage/page.tsx
│  ├─ settings/page.tsx
│  ├─ api/map/route.ts            # OpenAI proxy (server-only key)
│  ├─ layout.tsx
│  └─ globals.css                 # tokens (§5.1)
├─ components/
│  ├─ Caret.tsx  Button.tsx  FormRow.tsx  EntryCard.tsx
│  ├─ RedactionGate.tsx  MappingCandidate.tsx  Nav.tsx  TabBar.tsx
├─ lib/
│  ├─ redaction/      rules.json  redact.ts
│  ├─ rules-engine/   curriculum.json  mapping-rules.md  entry-templates.md
│  │                  drafting-style.md  synonyms.json  retrieve.ts  assemble.ts
│  ├─ openai/         client.ts  schema.ts
│  ├─ db/             dexie.ts  entries.ts  settings.ts
│  └─ export/         toKaizen.ts
├─ public/
├─ .env.local                     # OPENAI_API_KEY=...
├─ tailwind.config.ts
└─ package.json
```

---

## 15. Configuration

```
# .env.local  (server-only; never NEXT_PUBLIC_)
OPENAI_API_KEY=sk-...
OPENAI_MODEL_DEFAULT=gpt-4o-mini
```

The key is read only inside `app/api/map/route.ts`. Never expose it to the client.

---

## 16. Build milestones (hand to Claude Code in order)

**M1 — Scaffold + design system + landing page**
Next.js 15 + TS + Tailwind; tokens (§5.1); Courier Prime + JetBrains Mono via `next/font`; Caret/Button/FormRow/Nav components; full landing page (§7).
*Accept:* landing renders mobile-first at 360px; caret blinks (solid under reduced-motion); strict B&W; CTA routes to `/capture`.

**M2 — Capture + local storage**
`/capture` textarea (dictation-friendly), Dexie setup, autosave, `[ PROCESS ]` enabled on input.
*Accept:* a typed note persists across reload; no audio handling exists.

**M3 — Redaction engine + confirm gate**
`redaction-rules.json`, `redact.ts`, `RedactionGate` (§8.2); manual redact/restore.
*Accept:* NHS no./DOB/age/postcode/phone auto-replaced; names flagged for review; mapping cannot fire until confirm; nothing leaves the client before confirm (verify in network tab).

**M4 — Rules engine + OpenAI route**
`curriculum.json` seeded with all 11 domains + LOs (from official syllabi); `retrieve.ts` + `assemble.ts`; `/api/map` with Structured Outputs (§10).
*Accept:* posting redacted text returns schema-valid JSON; key never appears client-side; request body is redacted-only.

**M5 — Review screen**
`/review/[id]`: carbon-copy render, mapping candidates with confidence + rationale, entry-type selector, editable draft, Accept/Re-map/Discard.
*Accept:* user can change the chosen candidate, edit the draft, and accept → status `reviewed`.

**M6 — Inbox + export**
`/inbox` list/search/filter; `toKaizen.ts`; copy + download.
*Accept:* entries are filterable by domain/type/status; copy produces the §13 block; copying marks `exported`.

**M7 — Coverage map**
`/coverage` domain matrix with counts + thin flags.
*Accept:* counts reflect stored entries; thin domains flagged.

**M8 — Settings + rules editor + polish**
`/settings`: level/model toggles, owner-editable rules (overrides sent with requests), clear-data; accessibility + reduced-motion pass.
*Accept:* editing mapping rules changes mapping behaviour without redeploy; clear-data wipes IndexedDB; focus states visible throughout.

---

## 17. Deferred (post-v1)

In-app audio + Whisper/`gpt-4o-transcribe`; accounts + encrypted cloud sync (still PID-free); React Native iOS/Android; supervisor/ARCP summary views; direct Kaizen/Fry-IT integration (partnership); multi-college curriculum packs; embeddings upgrade for retrieval; shared identity with Bytes Teaching (decide before M2 if you want it early).

---

## 18. Open questions to resolve before/while building

- Pull and verify the **full 11-domain Progress+ taxonomy + LO/KC text** for `curriculum.json` (authoritative source: RCPCH syllabi).
- Confirm the **exact Kaizen reflection field set** so §13 maps 1:1.
- Decide **strict pure white vs warm paper** (`#FFFFFF` vs `#FBFBF9`) — spec defaults to pure white per "black and white."
- Validate whether the official RCPCH ePortfolio app already offers quick capture (positioning).
- OpenAI cost ceiling per map call at `gpt-4o-mini` vs `gpt-4o` — set the default and a usage note.
```