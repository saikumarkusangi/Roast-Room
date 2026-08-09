"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CrowdPulse } from "@/hooks/use_roast_playback";
import type { RoastReaction } from "@/lib/roast_sfx";

type Floater = {
  key: string;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  rotate: number;
};

const EMOJI_POOLS: Record<RoastReaction, string[]> = {
  worse: ["😮", "😱", "😲", "😮", "😱"],
  positive: ["👏", "🎉", "👏", "🎉", "👏"],
  laugh: ["😂", "😂", "😲", "😂", "👏"],
};

type FloatingReactionsProps = {
  pulse: CrowdPulse | null;
};

export function FloatingReactions({ pulse }: FloatingReactionsProps) {
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useEffect(() => {
    if (!pulse) return;
    const pool = EMOJI_POOLS[pulse.reaction];
    const count = 10 + (pulse.id % 5);
    const next: Floater[] = Array.from({ length: count }, (_, index) => ({
      key: `${pulse.id}-${index}`,
      emoji: pool[index % pool.length],
      left: 8 + ((index * 17 + pulse.id * 13) % 84),
      delay: (index % 6) * 0.08,
      duration: 2.4 + (index % 5) * 0.35,
      drift: (index % 2 === 0 ? 1 : -1) * (20 + (index % 40)),
      size: 22 + (index % 4) * 6,
      rotate: (index % 2 === 0 ? 1 : -1) * (12 + (index % 20)),
    }));
    setFloaters((prev) => [...prev, ...next]);
    const clearTimer = window.setTimeout(() => {
      setFloaters((prev) => prev.filter((item) => !item.key.startsWith(`${pulse.id}-`)));
    }, 5200);
    return () => window.clearTimeout(clearTimer);
  }, [pulse]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {floaters.map((floater) => (
          <motion.span
            key={floater.key}
            className="absolute bottom-[12%] select-none"
            style={{
              left: `${floater.left}%`,
              fontSize: floater.size,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -420 - (floater.size % 40),
              x: [0, floater.drift * 0.4, floater.drift],
              scale: [0.6, 1.15, 1],
              rotate: [0, floater.rotate, floater.rotate * 1.4],
            }}
            transition={{
              duration: floater.duration,
              delay: floater.delay,
              ease: "easeOut",
            }}
          >
            {floater.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
