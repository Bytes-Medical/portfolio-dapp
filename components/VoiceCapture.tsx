"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { Button } from "@/components/Button";
import { useDictation } from "@/lib/use-dictation";

type Engine = "cloud" | "webspeech";

/**
 * Voice capture control. Primary engine is ElevenLabs Scribe v2 Realtime (live
 * transcription via a server-minted single-use token); falls back to the browser's
 * Web Speech API when ElevenLabs isn't configured. Committed text is handed up via
 * onCommit; it then flows through the unchanged redaction gate before mapping.
 */
export function VoiceCapture({ onCommit }: { onCommit: (text: string) => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    languageCode: "en",
    onCommittedTranscript: (d) => commitRef.current(d.text),
    onError: () => setError("Voice error — tap to try again."),
  });

  const webspeech = useDictation((chunk) => commitRef.current(chunk));

  // Probe availability — reveals only a boolean, never the key.
  useEffect(() => {
    let active = true;
    fetch("/api/stt-token")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => {
        if (active) setConfigured(Boolean(d?.configured));
      })
      .catch(() => {
        if (active) setConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const engine: Engine = configured ? "cloud" : "webspeech";
  const listening =
    engine === "cloud"
      ? scribe.status === "connected" || scribe.status === "transcribing"
      : webspeech.status === "listening";
  const connecting =
    engine === "cloud" && (starting || scribe.status === "connecting");
  const interim = engine === "cloud" ? scribe.partialTranscript : webspeech.interim;
  const unsupported = engine === "webspeech" && webspeech.status === "unsupported";

  const start = useCallback(async () => {
    setError(undefined);
    if (engine === "cloud") {
      setStarting(true);
      try {
        const res = await fetch("/api/stt-token", { method: "POST" });
        if (!res.ok) throw new Error();
        const { token } = (await res.json()) as { token: string };
        await scribe.connect({
          token,
          microphone: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        setError("Couldn't start voice. Check mic permission and try again.");
      } finally {
        setStarting(false);
      }
    } else {
      webspeech.toggle();
    }
  }, [engine, scribe, webspeech]);

  const stop = useCallback(() => {
    if (engine === "cloud") {
      const trailing = scribe.partialTranscript?.trim();
      if (trailing) commitRef.current(trailing);
      scribe.disconnect();
    } else {
      webspeech.toggle();
    }
  }, [engine, scribe, webspeech]);

  if (configured === null) {
    return (
      <Button variant="ghost" disabled>
        ● Dictate
      </Button>
    );
  }
  if (unsupported) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={listening ? "primary" : "ghost"}
          onClick={() => (listening ? stop() : void start())}
          disabled={connecting}
          aria-pressed={listening}
          title={
            engine === "cloud"
              ? "Dictate — transcribed by ElevenLabs"
              : "Dictate — transcribed by your browser"
          }
        >
          {connecting ? (
            "Connecting…"
          ) : listening ? (
            "◼ Stop"
          ) : (
            <>
              <span aria-hidden="true" className="text-accent">
                ●
              </span>{" "}
              Dictate
            </>
          )}
        </Button>
        {listening ? (
          <span
            className="flex items-center gap-2 font-typed text-[0.8125rem] text-ink-muted"
            aria-live="polite"
          >
            <span aria-hidden="true" className="pulse-dot">
              ●
            </span>
            {interim ? `“${interim}”` : "listening…"}
          </span>
        ) : null}
      </div>

      <p className="mt-2 font-ui text-[0.6875rem] text-ink-faint">
        {engine === "cloud"
          ? "Voice is transcribed by ElevenLabs — audio leaves your device. Details are still scrubbed before anything is sent."
          : "Voice is transcribed by your browser."}
      </p>

      {error ? (
        <p role="alert" className="mt-1 font-ui text-[0.6875rem] text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
