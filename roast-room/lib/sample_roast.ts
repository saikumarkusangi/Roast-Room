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

/** Fixed script for local UI testing — no LLM calls. Client paces + TTS the lines. */
export function buildSampleRoastSteps(pitch: string): SampleStep[] {
  const snippet = pitch.trim().slice(0, 80) || "this idea";
  return [
    {
      kind: "message",
      phase: "roast",
      personaId: "vc",
      personaName: "The VC",
      color: "var(--blue)",
      delayMs: 350,
      body: `I'm going to stop you at "${snippet}${pitch.length > 80 ? "…" : ""}". That's a feature dressed as a company. Where's the wedge, the why-now, and the path to a real TAM?`,
    },
    {
      kind: "message",
      phase: "roast",
      personaId: "competitor",
      personaName: "The Competitor",
      color: "var(--purple)",
      delayMs: 350,
      body: "We shipped a version of this three years ago. The VC is right about market size — and you're also missing the hard part: retention after the novelty dies.",
    },
    {
      kind: "message",
      phase: "roast",
      personaId: "user",
      personaName: "The Harshest User",
      color: "var(--green)",
      delayMs: 350,
      body: "I already bounce between three half-working tools for this. Unless you save me an hour in week one, I'm not switching — and nothing in that pitch promises that.",
    },
    {
      kind: "message",
      phase: "founder",
      personaId: "founder",
      personaName: "The Founder",
      color: "var(--amber)",
      delayMs: 350,
      body: "Fair on the feature risk — our wedge is the workflow we already described, not another dashboard. If we can't prove time saved in the first session, we don't deserve the install.",
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: "vc",
      personaName: "The VC",
      color: "var(--blue)",
      delayMs: 300,
      body: "Cute defense. Still waiting for the market that pays for 'workflow'.",
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: "competitor",
      personaName: "The Competitor",
      color: "var(--purple)",
      delayMs: 300,
      body: "Prove retention and I'll stop yawning.",
    },
    {
      kind: "message",
      phase: "rebuttal",
      personaId: "user",
      personaName: "The Harshest User",
      color: "var(--green)",
      delayMs: 300,
      body: "Talk is cheap. Show me the hour back.",
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
        call_reason: "No clear wedge or distribution path beyond hoping users care.",
        strength: "The founder at least owned the 'feature not a company' hit.",
        weakness: "Nothing in the pitch proves why this wins the first week.",
        verdict: "A neat demo idea wearing a Series A costume.",
      },
    },
    {
      kind: "email",
      delayMs: 300,
      email: `Subject: Re: ${snippet.slice(0, 40) || "your pitch"}

Thanks for sharing this. We're going to pass — the market looks crowded and we didn't see a sharp enough wedge or distribution plan to get excited at this stage.

Happy to reconnect if retention and a clearer wedge show up in the data.

— Jordan`,
    },
  ];
}

export function isMockRoastEnabled(): boolean {
  const flag = process.env.MOCK_ROAST?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  if (flag === "0" || flag === "false" || flag === "no") return false;
  return process.env.NODE_ENV === "development";
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
