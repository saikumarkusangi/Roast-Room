import { EventEmitter } from "events";
import { PERSONAS, FOUNDER_PROMPT, VERDICT_PROMPT, EMAIL_PROMPT } from "@/lib/personas";
import { callClaude, parseJsonLoose } from "@/lib/anthropic";
import {
  buildSampleRoastSteps,
  isMockRoastEnabled,
  wait,
} from "@/lib/sample_roast";

export type Phase = "roast" | "founder" | "rebuttal" | "system";

export interface RoastMessage {
  id: string;
  phase: Phase;
  personaId: string;
  personaName: string;
  color: string;
  body: string;
  ts: number;
}

export interface Scorecard {
  market_size: number;
  differentiation: number;
  distribution: number;
  timing: number;
  defensibility: number;
  revenue_model: number;
}

export interface Verdict {
  scorecard: Scorecard;
  call: "BUILD" | "KILL";
  call_reason: string;
  strength: string;
  weakness: string;
  verdict: string;
}

export interface RoastSession {
  id: string;
  pitch: string;
  status: "running" | "done" | "error";
  error?: string;
  messages: RoastMessage[];
  verdict?: Verdict;
  email?: string;
  createdAt: number;
  mock?: boolean;
}

class RoastStore extends EventEmitter {
  sessions = new Map<string, RoastSession>();

  create(pitch: string): RoastSession {
    const id = Math.random().toString(36).slice(2, 9);
    const session: RoastSession = {
      id,
      pitch,
      status: "running",
      messages: [],
      createdAt: Date.now(),
      mock: isMockRoastEnabled(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): RoastSession | undefined {
    return this.sessions.get(id);
  }

  private pushMessage(session: RoastSession, msg: Omit<RoastMessage, "id" | "ts">) {
    const message: RoastMessage = {
      ...msg,
      id: Math.random().toString(36).slice(2, 9),
      ts: Date.now(),
    };
    session.messages.push(message);
    this.emit(`roast:${session.id}`, { type: "message", session });
  }

  private finish(session: RoastSession, status: "done" | "error", error?: string) {
    session.status = status;
    session.error = error;
    this.emit(`roast:${session.id}`, { type: "status", session });
  }

  private async orchestrateMock(session: RoastSession) {
    const steps = buildSampleRoastSteps(session.pitch);
    for (const step of steps) {
      await wait(step.delayMs);
      if (step.kind === "message") {
        this.pushMessage(session, {
          phase: step.phase,
          personaId: step.personaId,
          personaName: step.personaName,
          color: step.color,
          body: step.body,
        });
        continue;
      }
      if (step.kind === "verdict") {
        session.verdict = step.verdict;
        this.emit(`roast:${session.id}`, { type: "verdict", session });
        continue;
      }
      session.email = step.email;
      this.emit(`roast:${session.id}`, { type: "email", session });
    }
    this.finish(session, "done");
  }

  /** Runs the full debate sequentially, emitting an SSE event after each step. */
  async orchestrate(id: string) {
    const session = this.get(id);
    if (!session) return;

    if (isMockRoastEnabled()) {
      try {
        await this.orchestrateMock(session);
      } catch (err) {
        this.finish(session, "error", err instanceof Error ? err.message : "unknown error");
      }
      return;
    }

    try {
      const transcript = () =>
        session.messages
          .map((m) => `${m.personaName}: ${m.body}`)
          .join("\n\n");

      for (const persona of PERSONAS) {
        const context = `PITCH:\n${session.pitch}\n\nDEBATE SO FAR:\n${transcript() || "(nothing said yet)"}`;
        const body = await callClaude(persona.systemPrompt, [
          { role: "user", content: context },
        ]);
        this.pushMessage(session, {
          phase: "roast",
          personaId: persona.id,
          personaName: persona.name,
          color: persona.color,
          body,
        });
      }

      {
        const context = `PITCH:\n${session.pitch}\n\nWHAT WAS SAID ABOUT IT:\n${transcript()}`;
        const body = await callClaude(FOUNDER_PROMPT, [
          { role: "user", content: context },
        ]);
        this.pushMessage(session, {
          phase: "founder",
          personaId: "founder",
          personaName: "The Founder",
          color: "var(--amber)",
          body,
        });
      }

      for (const persona of PERSONAS) {
        const context = `PITCH:\n${session.pitch}\n\nFULL DEBATE SO FAR:\n${transcript()}`;
        const body = await callClaude(persona.rebuttalPrompt, [
          { role: "user", content: context },
        ]);
        this.pushMessage(session, {
          phase: "rebuttal",
          personaId: persona.id,
          personaName: persona.name,
          color: persona.color,
          body,
        });
      }

      {
        const context = `PITCH:\n${session.pitch}\n\nFULL DEBATE:\n${transcript()}`;
        const raw = await callClaude(VERDICT_PROMPT, [{ role: "user", content: context }], 500);
        session.verdict = parseJsonLoose<Verdict>(raw);
        this.emit(`roast:${session.id}`, { type: "verdict", session });
      }

      {
        const context = `PITCH:\n${session.pitch}\n\nFULL DEBATE:\n${transcript()}\n\nVERDICT: ${JSON.stringify(session.verdict)}`;
        const email = await callClaude(EMAIL_PROMPT, [{ role: "user", content: context }], 300);
        session.email = email;
        this.emit(`roast:${session.id}`, { type: "email", session });
      }

      this.finish(session, "done");
    } catch (err) {
      this.finish(session, "error", err instanceof Error ? err.message : "unknown error");
    }
  }
}

const g = globalThis as unknown as { __roastStore?: RoastStore };
export const store = g.__roastStore ?? (g.__roastStore = new RoastStore());
store.setMaxListeners(0);
