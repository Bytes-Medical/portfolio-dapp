// Base URL for the hosted API (the OpenAI/ElevenLabs key holder).
//
// On the web build this is empty, so calls stay same-origin and relative.
// In the mobile build (Capacitor) the UI is bundled into the app and has no
// server of its own, so this is set to the Render URL at build time via
// NEXT_PUBLIC_API_BASE_URL — letting the app reach the backend over HTTPS.
// NEXT_PUBLIC_ vars are inlined at build time, so this works on the client.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Prefix an API path with the configured base (no-op on web). */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;
