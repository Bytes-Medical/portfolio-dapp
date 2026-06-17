"use client";

import { useEffect, useState } from "react";
import { Caret } from "./Caret";

/**
 * The hero thesis: a typed sentence completing itself (§7.2).
 * Types out on load; under prefers-reduced-motion it renders complete at once
 * with a solid (non-blinking) caret. Full text is always exposed to AT.
 */
export function HeroHeadline({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <h1 className={`font-typed ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      <Caret />
    </h1>
  );
}
