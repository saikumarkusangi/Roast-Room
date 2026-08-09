"use client";

import { motion } from "framer-motion";
import { extractStartupName, summarizePitch } from "@/lib/arena";

type StageCenterProps = {
  pitch: string;
  statusLabel: string;
  founderLine?: string;
  darkened?: boolean;
};

export function StageCenter({ pitch, statusLabel, founderLine, darkened }: StageCenterProps) {
  const name = extractStartupName(pitch);
  const summary = summarizePitch(pitch, 150);

  return (
    <motion.div
      className="relative z-10 w-full max-w-[380px] mx-auto"
      animate={{
        scale: darkened ? 0.94 : 1,
        opacity: darkened ? 0.4 : 1,
        filter: darkened ? "blur(2px)" : "blur(0px)",
      }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        className="absolute inset-[-12%] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(230,50,40,0.22) 0%, rgba(232,184,74,0.08) 45%, transparent 70%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="stage-ring relative aspect-square rounded-full border border-[rgba(240,230,212,0.22)] overflow-hidden"
        animate={{
          boxShadow: [
            "0 0 36px rgba(230,50,40,0.18)",
            "0 0 64px rgba(232,184,74,0.22)",
            "0 0 36px rgba(230,50,40,0.18)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="absolute inset-[7%] rounded-full border border-white/15 bg-[radial-gradient(circle_at_50%_38%,rgba(70,28,28,0.55),rgba(20,12,16,0.72))]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-7 sm:px-9 text-center">
          <p className="font-mono-app text-[10px] tracking-[0.28em] uppercase text-[var(--gold)] mb-2">
            {statusLabel}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl leading-[0.95] text-[var(--cream)] mb-3 break-words">
            {name}
          </h2>
          <p className="text-xs sm:text-[13px] text-[var(--text-dim)] leading-relaxed max-w-[260px]">
            {founderLine || summary}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
