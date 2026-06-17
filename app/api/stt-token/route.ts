import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Availability probe — reveals only whether voice is configured (never the key). */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ELEVENLABS_API_KEY) });
}

/**
 * Mints a single-use, 15-minute token for browser-side realtime Scribe STT.
 * The ELEVENLABS_API_KEY lives only here (server-side); the browser only ever
 * sees the short-lived token (§ voice-capture plan, mirrors /api/map key handling).
 */
export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "NO_KEY",
        message: "Voice transcription isn't configured. Add ELEVENLABS_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const { token } = await client.tokens.singleUse.create("realtime_scribe");
    return NextResponse.json({ token });
  } catch {
    // No logging of details (privacy posture).
    return NextResponse.json(
      { error: "TOKEN_FAILED", message: "Could not start voice transcription." },
      { status: 502 },
    );
  }
}
