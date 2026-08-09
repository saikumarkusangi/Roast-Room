"use client";

import { motion } from "framer-motion";
import type { Verdict } from "@/lib/roastStore";
import { averageScore } from "@/lib/arena";

type VerdictOrbProps = {
  verdict: Verdict;
  onClose: () => void;
};

export function VerdictOrb({ verdict, onClose }: VerdictOrbProps) {
  const score = averageScore(verdict.scorecard);
  const isKill = verdict.call === "KILL";
  const stampLabel = isKill ? "REJECTED" : "APPROVED";
  const stampColor = isKill ? "var(--red)" : "var(--green)";
  const stampBorder = isKill ? "rgba(230, 50, 40, 0.95)" : "rgba(61, 214, 140, 0.95)";

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center px-5 py-8 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,#050408_0%,#0a090c_42%,#120e12_100%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(230,50,40,0.12),transparent_55%)]"
        aria-hidden
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 z-20 font-poster uppercase text-[11px] tracking-[0.2em] text-[var(--text-dim)] hover:text-[var(--cream)] border border-white/15 px-3 py-2 rounded-lg bg-black/40"
      >
        Close Arena
      </button>

      <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center">
        <div className="relative mb-8 flex min-h-[5.5rem] w-full items-center justify-center">
          <motion.div
            className="verdict-stamp"
            style={{ color: stampColor, borderColor: stampBorder }}
            initial={{ opacity: 0, scale: 3.2, rotate: -28 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{
              duration: 0.55,
              delay: 0.2,
              ease: [0.12, 0.9, 0.2, 1],
            }}
          >
            <span className="verdict-stamp__ink" />
            <span className="font-display text-4xl sm:text-5xl leading-none tracking-[0.08em]">
              {stampLabel}
            </span>
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 0.3, delay: 0.55 }}
            style={{
              background: isKill
                ? "radial-gradient(circle, rgba(230,50,40,0.35), transparent 55%)"
                : "radial-gradient(circle, rgba(61,214,140,0.28), transparent 55%)",
            }}
            aria-hidden
          />
        </div>

        <div
          className="mx-auto mb-6 py-10 items-center justify-center"
          style={{
            borderColor: "rgba(240, 230, 212, 0.28)",
       
          }}
        >
          <div>
            <p className="font-poster uppercase text-[18px] tracking-[0.28em] text-white/55 mb-1">
              Roast Score
            </p>
            <p className="font-display text-5xl sm:text-6xl leading-none text-[var(--cream)]">
              {score}
            </p>
          </div>
        </div>

        <p className="text-base sm:text-lg text-[var(--cream)] leading-relaxed mb-6">
          {verdict.verdict}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-left mb-8 w-full">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="font-poster uppercase text-[10px] tracking-[0.2em] text-[var(--cream)]/70 mb-2">
              Strength
            </p>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">{verdict.strength}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="font-poster uppercase text-[10px] tracking-[0.2em] text-[var(--cream)]/70 mb-2">
              Weakness
            </p>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">{verdict.weakness}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={onClose} className="btn-enter px-8 py-3 text-lg uppercase w-full sm:w-auto">
            Close Arena
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-poster uppercase text-[11px] tracking-[0.2em] text-[var(--text-dim)] hover:text-[var(--cream)] px-4 py-3"
          >
            Fight Again →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
