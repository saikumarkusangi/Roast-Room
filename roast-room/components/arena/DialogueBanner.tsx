"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { type ArenaPersonaId } from "@/lib/arena";

type DialogueBannerProps = {
  speakerId: ArenaPersonaId | "founder" | null;
  text?: string;
  live?: boolean;
};

const TYPE_MS = 22;

export function DialogueBanner({ speakerId, text, live = false }: DialogueBannerProps) {
  const labelKey = speakerId ?? "none";
  const [typed, setTyped] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const previousTextRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  function updateScrollFades() {
    const container = scrollRef.current;
    if (!container) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = container;
    setCanScrollUp(scrollTop > 8);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 8);
  }

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: live ? "auto" : "smooth",
    });
    updateScrollFades();
  }, [displayText, live]);

  const fadeClass =
    canScrollUp && canScrollDown
      ? "dialogue-scroll--fade-both"
      : canScrollUp
        ? "dialogue-scroll--fade-top"
        : canScrollDown
          ? "dialogue-scroll--fade-bottom"
          : "";

  return (
    <div className="relative z-40 w-full max-w-3xl mx-auto px-2 sm:px-4">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.div
            key={live ? `${labelKey}-live` : `${labelKey}-${text.slice(0, 48)}`}
            className="w-full"
            initial={live ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              ref={scrollRef}
              onScroll={updateScrollFades}
              className={`dialogue-scroll max-h-[28vh] sm:max-h-[32vh] overflow-y-auto overscroll-contain px-5 sm:px-8 py-2 ${fadeClass}`}
            >
              <p className="font-display text-center text-2xl sm:text-3xl md:text-4xl leading-snug tracking-wide text-[var(--cream)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
                {displayText}
                {showCaret && (
                  <span className="terminal-caret inline-block w-[0.08em] h-[0.85em] ml-1 align-[-0.08em] bg-[var(--cream)]" />
                )}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            className="w-full py-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-poster uppercase text-[11px] tracking-[0.22em] text-[var(--text-faint)]">
              Judges taking positions…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
