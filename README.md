# Byte Portfolio

A minute of talking in. A curriculum-mapped portfolio entry out.

Capture a clinical learning moment as text or voice, redact patient identifiers
**on the device**, send only the redacted text to map it against RCPCH Progress+,
review the AI draft, and export a Kaizen-ready block. Entries persist locally
(IndexedDB) — no patient-identifiable data ever leaves the device.

Ships three ways from one codebase: a web app, and native **iOS + Android** apps
(via Capacitor).

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind v4 · Dexie (IndexedDB) ·
OpenAI (mapping) · ElevenLabs (voice) · Capacitor (native shell).

---

## How it's wired (read this first)

There are two pieces:

1. **The app** — the entire UI and all your data. Runs on the device (browser, or
   inside the native app's WebView). Works offline.
2. **The backend** — just two API routes (`/api/map`, `/api/stt-token`). They exist
   for one reason: they hold the **OpenAI and ElevenLabs secret keys**, which must
   never ship inside a phone app. So this thin slice runs on a server (Render).

```
┌─────────────── device ───────────────┐         ┌──── Render ────┐
│  UI  +  IndexedDB  +  redaction       │         │  /api/map      │
│  (works offline, holds your data)     │ ──────▶ │  /api/stt-token│
│                                       │ redacted│  (holds keys)  │
└───────────────────────────────────────┘  text  └────────────────┘
```

Only **redacted** text crosses that line. The web build and the backend are the
same server; the mobile build bundles only the UI and calls the backend over HTTPS.

---

## 1. Run locally (web)

```bash
npm install
cp .env.example .env        # then add your keys
npm run dev                 # http://localhost:3000
```

Minimum `.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL_DEFAULT=gpt-4o-mini
ELEVENLABS_API_KEY=sk_...   # optional — enables voice; typing works without it
```
Keys are read **only** in the server routes, never sent to the client. Without
`OPENAI_API_KEY` the app is fully navigable; mapping shows a clear "not configured"
message.

---

## 2. Deploy the backend (Render)

The native apps need a live HTTPS backend. The repo includes `render.yaml`.

1. Push to GitHub (already done: `Bytes-Medical/portfolio-dapp`).
2. In the Render dashboard → **New → Blueprint** → pick this repo. It reads
   `render.yaml` and creates the `byte-portfolio-api` web service.
3. Set the secrets on the service (**Environment** tab):
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
4. Deploy. You'll get a URL like `https://byte-portfolio-api.onrender.com`.

> Free tier sleeps after ~15 min idle and cold-starts in 30–60s. Hit the URL once
> before a demo to wake it.

---

## 3. Build the mobile apps (Capacitor)

**Prerequisites:** macOS + **Xcode** for iOS (CocoaPods *not* needed — Capacitor 8
uses Swift Package Manager). **Android Studio** + SDK + JDK 17+ for Android.

First, point the app at your Render backend. Add to `.env`:
```
NEXT_PUBLIC_API_BASE_URL=https://byte-portfolio-api.onrender.com
```
This is baked into the bundle at build time (leave it empty for the web build).

Then:
```bash
npm run cap:ios       # build static bundle → sync → open Xcode
npm run cap:android   # build static bundle → sync → open Android Studio
```
In Xcode / Android Studio, press **Run** to launch on a simulator/emulator or a
connected device. (For the App Store / Play Store you'll also set a signing team
and a bundle/app id — currently `com.bytesmedical.portfolio`.)

Re-run `npm run cap:sync` any time you change the web app to push the new bundle
into the native projects.

---

## Build modes & scripts
- `npm run dev` — web dev server
- `npm run build` / `npm start` — server build (this is what Render runs; keeps `/api`)
- `npm run build:static` — static export → `./out` for the native bundle
  (stashes `app/api` during export, since POST routes can't be statically exported)
- `npm run cap:sync` / `cap:ios` / `cap:android` — build + sync + open native
- `npm run typecheck` — `tsc --noEmit`

## Privacy spine (non-negotiable)
- Redaction runs client-side and **blocks** the network call (`components/RedactionGate.tsx`).
- The body sent to `/api/map` contains only redacted text; keys never reach the client.
- The `entries` store holds redacted content only. The raw capture draft lives in a
  separate, transient store, cleared the moment a note is processed.
- No accounts, no sign-in, no server-side database. (Any future paid version is a
  paid Play Store / App Store listing, not in-app billing.)

## Map of the code
```
app/(marketing)/page.tsx     landing
app/(app)/capture            capture + redaction gate
app/(app)/review             review mapping + draft (reads ?id=)
app/(app)/inbox              list/search/filter + Kaizen export
app/(app)/coverage           domain coverage matrix
app/(app)/settings           rules editor, level/model toggles, clear data
app/api/map/route.ts         OpenAI proxy (server-only key)
app/api/stt-token/route.ts   ElevenLabs single-use voice token (server-only key)
lib/api-base.ts              configurable backend URL for the mobile build
lib/redaction                client-side redaction engine
lib/rules-engine             curriculum (real RCPCH core syllabus) + retrieval + prompts
lib/db                       Dexie stores (entries, settings, captureDraft)
capacitor.config.ts          native shell config (webDir: out, CapacitorHttp)
render.yaml                  backend deploy blueprint
```

> A drafting aid, not an official ePortfolio. Reflections must be anonymised.
