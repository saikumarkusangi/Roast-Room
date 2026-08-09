"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type ParticleFieldProps = {
  count?: number;
  color?: string;
};

export function ParticleField({ count = 28, color = "rgba(240,230,212,0.35)" }: ParticleFieldProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      left: `${(index * 37) % 100}%`,
      size: 2 + (index % 4),
      duration: 6 + (index % 7),
      delay: (index % 10) * 0.35,
      drift: (index % 2 === 0 ? 1 : -1) * (12 + (index % 18)),
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.left,
            bottom: "-4%",
            width: particle.size,
            height: particle.size,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          animate={{
            y: [0, -520 - particle.drift],
            x: [0, particle.drift, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
