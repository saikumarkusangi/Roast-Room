"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ARENA_PERSONAS, type ArenaPersonaId } from "@/lib/arena";

type DialogueBannerProps = {
  speakerId: ArenaPersonaId | "founder" | null;
  text?: string;
  /** Show text immediately (for live mic transcript — no restart glitch). */
  live?: boolean;
};

const TYPE_MS = 22;

export function DialogueBanner({ speakerId, text, live = false }: DialogueBannerProps) {
  const persona =
    speakerId && speakerId !== "founder"
      ? ARENA_PERSONAS.find((item) => item.id === speakerId)
      : null;
  const label = speakerId === "founder" ? "The Founder" : persona?.title;
  const accent =
    speakerId === "founder" ? "var(--gold)" : persona?.accent ?? "var(--cream)";
  const [typed, setTyped] = useState("");
  const previousTextRef = useRef("");

  useEffect(() => {
    if (!text) {
      setTyped("");
      previousTextRef.current = "";
      return;
    }
    if (live) {
      setTyped(text);
      previousTextRef.current = text;
      return;
    }
    const previous = previousTextRef.current;
    const isExtension = text.startsWith(previous) && previous.length > 0;
    let index = isExtension ? previous.length : 0;
    if (!isExtension) setTyped("");
    previousTextRef.current = text;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [text, live]);

  const displayText = live ? text ?? "" : typed;
  const showCaret = Boolean(text) && (live || displayText.length < (text?.length ?? 0));

  return (
    <div className="relative z-40 w-full max-w-4xl mx-auto min-h-[8rem] px-2 sm:px-4">
      <AnimatePresence mode="wait">
        {text && label ? (
          <motion.div
            key={live ? `${label}-live` : `${label}-${text.slice(0, 48)}`}
            className="w-full text-center"
            initial={live ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p
              className="font-poster uppercase text-[11px] sm:text-xs tracking-[0.28em] mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
              style={{ color: accent }}
            >
              {label}
            </p>
            <p className="font-display text-2xl sm:text-3xl md:text-4xl leading-snug tracking-wide text-[var(--cream)] drop-shadow-[0_3px_16px_rgba(0,0,0,0.9)]">
              {displayText}
              {showCaret && (
                <span className="terminal-caret inline-block w-[0.08em] h-[0.85em] ml-1 align-[-0.08em] bg-[var(--cream)]" />
              )}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            className="w-full text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-poster uppercase text-[11px] tracking-[0.22em] text-[var(--text-faint)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Judges taking positions…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
