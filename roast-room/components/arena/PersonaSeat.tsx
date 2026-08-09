"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ARENA_PERSONAS, type ArenaPersonaId } from "@/lib/arena";

type PersonaSeatProps = {
  personaId: ArenaPersonaId;
  isActive: boolean;
  isDimmed: boolean;
  compact?: boolean;
};

export function PersonaSeat({ personaId, isActive, isDimmed, compact = false }: PersonaSeatProps) {
  const persona = ARENA_PERSONAS.find((item) => item.id === personaId);
  if (!persona) return null;

  return (
    <motion.div
      className={`relative w-full ${compact ? "max-w-[220px]" : "max-w-[260px]"} mx-auto`}
      animate={{
        scale: isActive ? 1.04 : 1,
        opacity: isDimmed ? 0.62 : 1,
        y: isActive ? -4 : 0,
        filter: isDimmed ? "brightness(0.85)" : "brightness(1)",
      }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      <motion.div
        className="absolute -inset-3 rounded-[28px] blur-2xl"
        animate={{
          opacity: isActive ? 0.8 : 0.18,
          scale: isActive ? 1.08 : 0.95,
        }}
        style={{ background: persona.glow }}
      />
      <div
        className="relative overflow-hidden rounded-2xl border bg-black/40"
        style={{
          borderColor: isActive ? persona.accent : "rgba(255,255,255,0.16)",
          boxShadow: isActive
            ? `0 0 36px ${persona.glow}`
            : "0 16px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className={`relative bg-black ${compact ? "aspect-[5/4]" : "aspect-[4/5]"}`}>
          <Image
            src={persona.image}
            alt={persona.label}
            fill
            className="object-cover object-top"
            sizes="260px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p
            className={`font-display leading-none tracking-wide ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}
            style={{ color: persona.accent }}
          >
            {persona.label}
          </p>
          <p className="font-poster uppercase text-[10px] tracking-[0.16em] text-white/75 mt-1">
            {persona.role}
          </p>
        </div>
        {isActive && (
          <div
            className="absolute top-3 right-3 font-poster uppercase text-[9px] tracking-[0.2em] px-2 py-1 rounded-full border bg-black/50"
            style={{ color: persona.accent, borderColor: persona.accent }}
          >
            Live
          </div>
        )}
      </div>
    </motion.div>
  );
}
