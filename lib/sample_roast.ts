import { getArena, type ArenaId } from "@/lib/arenas";
import type { Verdict } from "@/lib/roastStore";

export type SampleStep =
  | {
      kind: "message";
      phase: "roast" | "founder" | "rebuttal";
      personaId: string;
      personaName: string;
      color: string;
      body: string;
      delayMs: number;
    }
  | {
      kind: "verdict";
      verdict: Verdict;
      delayMs: number;
    }
  | {
      kind: "email";
      email: string;
      delayMs: number;
    };

export function isMockRoastEnabled(): boolean {
  const flag = process.env.MOCK_ROAST?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  if (flag === "0" || flag === "false" || flag === "no") return false;
  return process.env.NODE_ENV === "development";
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fixed script for local UI testing — no LLM calls. Client paces + TTS the lines. */
export function buildSampleRoastSteps(
  pitch: string,
  arenaId: ArenaId | string = "startup"
): SampleStep[] {
  const arena = getArena(arenaId);
  const [j1, j2, j3] = arena.judges;
  const snippet = pitch.trim().slice(0, 80) || "this submission";
  return [
    {
      kind: "message",
      phase: "roast",
      personaId: j1.id,
      personaName: j1.title,
      color: j1.accent,
      delayMs: 350,
      body: `I'm going to stop you at "${snippet}${pitch.length > 80 ? "…" : ""}". That's thin. Where's the proof, the wedge, and the reason anyone should care now?`,
    },
    {
      kind: "message",
      phase: "roast",
      personaId: j2.id,
      personaName: j2.title,
      color: j2.accent,
      delayMs: 350,
      body: `We've seen this shape before. ${j1.title} is right about the weak spot — and you're also missing the hard part that actually decides winners.`,
    },
    {
      kind: "message",
      phase: "roast",
      personaId: j3.id,
      personaName: j3.title,
      color: j3.accent,
      delayMs: 350,
      body: `Unless you change something concrete for me in week one, I'm out — and nothing in that submission promises that.`,
    },
    {
      kind: "message",
      phase: "founder",
      personaId: "founder",
      personaName: arena.founderLabel,
      color: "var(--amber)",
      delayMs: 350,
      body: `Fair on the risk — our wedge is what's already in the submission, not a new story. If we can't prove value fast, we don't deserve the yes.`,
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: j1.id,
      personaName: j1.title,
      color: j1.accent,
      delayMs: 300,
      body: `Cute defense. Still waiting for the proof that pays.`,
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: j2.id,
      personaName: j2.title,
      color: j2.accent,
      delayMs: 300,
      body: `Prove the hard part — and I'll stop yawning.`,
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: j3.id,
      personaName: j3.title,
      color: j3.accent,
      delayMs: 300,
      body: `Talk is cheap. Show me the change.`,
    },
    {
      kind: "verdict",
      delayMs: 400,
      verdict: {
        scorecard: {
          market_size: 4,
          differentiation: 5,
          distribution: 3,
          timing: 5,
          defensibility: 3,
          revenue_model: 4,
        },
        call: "KILL",
        call_reason: "No clear wedge or proof beyond hoping people care.",
        strength: "At least owned the hardest hit.",
        weakness: "Nothing proves why this wins the first week.",
        verdict: "A neat idea wearing a finished product costume.",
      },
    },
    {
      kind: "email",
      delayMs: 300,
      email: `Subject: Re: ${snippet.slice(0, 40) || "your submission"}

Thanks for sharing this. We're going to pass — we didn't see a sharp enough wedge or proof to get excited at this stage.

Happy to reconnect if clearer traction shows up.

— Jordan`,
    },
  ];
}
