import { getArena, type ArenaId } from "@/lib/arenas";

export type ArenaPhase = "landing" | "arena" | "verdict";

export type ArenaPersonaId = "vc" | "competitor" | "user";

/** UI personas for the active arena (display names + accents). */
export function getArenaPersonas(arenaId?: ArenaId | string) {
  const arena = getArena(arenaId);
  return arena.judges.map((judge) => ({
    id: judge.id,
    label: judge.title,
    title: judge.title,
    role: judge.role,
    accent: judge.accent,
    glow: `${judge.accent}88`,
    image:
      judge.id === "vc"
        ? "/persona-investor.png"
        : judge.id === "competitor"
          ? "/persona-competitor.png"
          : "/persona-user.png",
    position:
      judge.id === "vc"
        ? ("left" as const)
        : judge.id === "competitor"
          ? ("right" as const)
          : ("bottom" as const),
  }));
}

/** @deprecated Prefer getArenaPersonas(arenaId) */
export const ARENA_PERSONAS = getArenaPersonas("startup");

const BRAND_PATTERN = /^([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\s*[-—–:]/;

export function extractStartupName(pitch: string): string {
  const cleaned = pitch.trim();
  if (!cleaned) return "THE CONTENDER";

  const brandMatch = cleaned.match(BRAND_PATTERN);
  if (brandMatch?.[1] && brandMatch[1].length <= 28) {
    return brandMatch[1].toUpperCase();
  }

  const dashSplit = cleaned.split(/\s+[—–-]\s+/);
  const head = dashSplit[0]?.trim() ?? "";
  const headWords = head.split(/\s+/);
  if (
    headWords.length > 0 &&
    headWords.length <= 3 &&
    head.length <= 28 &&
    !/^(book|build|we|our|an|a|the)\b/i.test(head)
  ) {
    return head.toUpperCase();
  }

  return "THE CONTENDER";
}

export function summarizePitch(pitch: string, max = 140): string {
  const trimmed = pitch.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function averageScore(scorecard: {
  market_size: number;
  differentiation: number;
  distribution: number;
  timing: number;
  defensibility: number;
  revenue_model: number;
}): number {
  const values = Object.values(scorecard);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
