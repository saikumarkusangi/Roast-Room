export type ArenaPhase = "landing" | "arena" | "verdict";

export const ARENA_PERSONAS = [
  {
    id: "vc",
    label: "Investor",
    title: "The VC",
    role: "Sees 40 pitches a week",
    accent: "#e8b84a",
    glow: "rgba(232, 184, 74, 0.55)",
    image: "/persona-investor.png",
    position: "left" as const,
  },
  {
    id: "competitor",
    label: "Competitor",
    title: "The Rival",
    role: "Already shipped this",
    accent: "#e63228",
    glow: "rgba(230, 50, 40, 0.55)",
    image: "/persona-competitor.png",
    position: "right" as const,
  },
  {
    id: "user",
    label: "Harsh User",
    title: "Target Customer",
    role: "Won't switch",
    accent: "#6aa8ff",
    glow: "rgba(106, 168, 255, 0.55)",
    image: "/persona-user.png",
    position: "bottom" as const,
  },
] as const;

export type ArenaPersonaId = (typeof ARENA_PERSONAS)[number]["id"];

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
  if (headWords.length > 0 && headWords.length <= 3 && head.length <= 28 && !/^(book|build|we|our|an|a|the)\b/i.test(head)) {
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
