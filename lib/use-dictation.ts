import { useCallback, useEffect, useRef, useState } from "react";

export type DictationStatus = "unsupported" | "idle" | "listening";

/**
 * Fallback voice capture via the browser's Web Speech API (used when ElevenLabs
 * isn't configured). Transcription happens at the browser/OS level — the app only
 * receives text. Fixes the earlier bugs: live interim results, side-effects kept
 * out of the state updater, and auto-restart so silence doesn't silently stop it.
 */
export function useDictation(onFinalText: (text: string) => void) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false); // does the user currently want to be listening?
  const cbRef = useRef(onFinalText);
  cbRef.current = onFinalText;

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalChunk = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) finalChunk += t;
        else partial += t;
      }
      if (finalChunk.trim()) {
        cbRef.current(finalChunk.trim());
        setInterim("");
      } else {
        setInterim(partial);
      }
    };
    rec.onend = () => {
      // The engine stops on silence; restart while the user still wants to listen.
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      } else {
        setStatus("idle");
        setInterim("");
      }
    };
    rec.onerror = () => {
      wantRef.current = false;
      setStatus("idle");
      setInterim("");
    };
    recRef.current = rec;
    return () => {
      wantRef.current = false;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (wantRef.current) {
      wantRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setStatus("idle");
      setInterim("");
    } else {
      wantRef.current = true;
      try {
        rec.start();
        setStatus("listening");
      } catch {
        wantRef.current = false;
      }
    }
  }, []);

  return { status, interim, toggle };
}
