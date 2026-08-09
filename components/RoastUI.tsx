import { RoastMessage, Verdict } from "@/lib/roastStore";

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
}

export function PhaseDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="font-mono-app text-[10px] tracking-widest text-[var(--text-faint)]"
      >
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

export function MessageLine({ message }: { message: RoastMessage }) {
  return (
    <div className="log-entry font-mono-app text-[13px] leading-relaxed">
      <span style={{ color: "var(--text-faint)" }}>[{formatClock(message.ts)}]</span>{" "}
      <span style={{ color: message.color, fontWeight: 600 }}>{message.personaName}</span>
      <div className="text-[var(--text)] mt-0.5 pl-1">{message.body}</div>
    </div>
  );
}

const AXIS_LABELS: Record<string, string> = {
  market_size: "MARKET SIZE",
  differentiation: "DIFFERENTIATION",
  distribution: "DISTRIBUTION",
  timing: "TIMING",
  defensibility: "DEFENSIBILITY",
  revenue_model: "REVENUE MODEL",
};

export function Scorecard({ verdict }: { verdict: Verdict }) {
  const entries = Object.entries(verdict.scorecard) as [string, number][];
  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono-app text-[11px] tracking-widest text-[var(--text-dim)]">
          REALITY CHECK
        </span>
        <span
          className="font-mono-app text-[11px] tracking-widest px-2.5 py-1 rounded border"
          style={{
            color: verdict.call === "BUILD" ? "var(--green)" : "var(--red)",
            borderColor: verdict.call === "BUILD" ? "var(--green-dim)" : "var(--red-dim)",
            background:
              verdict.call === "BUILD"
                ? "color-mix(in srgb, var(--green-dim) 40%, transparent)"
                : "color-mix(in srgb, var(--red-dim) 40%, transparent)",
          }}
        >
          {verdict.call}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="font-mono-app text-[10px] tracking-wide text-[var(--text-dim)] w-32 shrink-0">
              {AXIS_LABELS[key] ?? key}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--panel-raised)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${val * 10}%`,
                  background: val >= 7 ? "var(--green)" : val >= 4 ? "var(--amber)" : "var(--red)",
                }}
              />
            </div>
            <span className="font-mono-app text-[11px] text-[var(--text-dim)] w-8 text-right">
              {val}/10
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono-app text-[12px] text-[var(--text-faint)] mb-3">
        {verdict.call_reason}
      </p>

      <div className="grid grid-cols-2 gap-3 text-[12px] mb-3">
        <div>
          <div className="font-mono-app text-[10px] tracking-widest text-[var(--green)] mb-1">
            STRENGTH
          </div>
          <p className="text-[var(--text-dim)] leading-snug">{verdict.strength}</p>
        </div>
        <div>
          <div className="font-mono-app text-[10px] tracking-widest text-[var(--red)] mb-1">
            WEAKNESS
          </div>
          <p className="text-[var(--text-dim)] leading-snug">{verdict.weakness}</p>
        </div>
      </div>

      <p className="text-sm font-medium leading-snug pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        &ldquo;{verdict.verdict}&rdquo;
      </p>
    </div>
  );
}

export function RejectionEmail({ email }: { email: string }) {
  const lines = email.split("\n").filter(Boolean);
  const subject = lines[0]?.replace(/^Subject:\s*/i, "");
  const body = lines.slice(1).join("\n\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard access denied — silently ignore
    }
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)", background: "#fdfbf6" }}
    >
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: "#e5ddc8" }}
      >
        <span className="font-mono-app text-[11px] tracking-widest" style={{ color: "#8a7d5c" }}>
          INVESTOR REJECTION EMAIL
        </span>
        <button
          onClick={copy}
          className="font-mono-app text-[11px] tracking-wide px-2 py-1 rounded border"
          style={{ color: "#8a7d5c", borderColor: "#e5ddc8" }}
        >
          copy
        </button>
      </div>
      <div className="p-5 text-[#2a2620]">
        <p className="text-xs mb-3" style={{ color: "#8a7d5c" }}>
          Subject: {subject}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif">{body}</p>
      </div>
    </div>
  );
}
