"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, FormEvent } from "react";
import { ArenaExperience } from "@/components/arena/ArenaExperience";
import { playRingBell, unlockAudio } from "@/lib/ring_bell";
import type { RoastSession } from "@/lib/roastStore";

const MAX_CHARS = 1500;

const HOW_IT_WORKS_STEPS = [
  {
    title: "Step up to the mic",
    body: "Type your startup pitch — or hit Record and speak it. Keep it sharp; the judges hear every word.",
  },
  {
    title: "Enter the ring",
    body: "Ring the bell and the arena takes over. No page hop — the stage lights up live on this screen.",
  },
  {
    title: "Three judges roast you",
    body: "Investor, Competitor, and Harsh User take turns. The camera cuts to their POV while they speak.",
  },
  {
    title: "One defense",
    body: "After the first round, grab the mic and reply live. Your words become the founder defense — or skip and use the house line.",
  },
  {
    title: "Stamp the verdict",
    body: "Score lands. APPROVED or REJECTED stamps the call, with a strength, a weakness, and a final gut punch.",
  },
] as const;

const EXAMPLES = [
  {
    title: "PawRush",
    pitch:
      "PawRush — book professional pet groomers on demand. Track arrival in real time, manage pet profiles, and pay through the app.",
  },
  {
    title: "ParkShare",
    pitch:
      "ParkShare — homeowners list empty parking spaces. Drivers book hourly or monthly parking at a fraction of commercial lot prices.",
  },
  {
    title: "CreatorHub",
    pitch:
      "CreatorHub — creators sell memberships, gated content, courses, and community access from a single platform with lower fees.",
  },
] as const;

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function joinPitchParts(base: string, spoken: string): string {
  const trimmedSpoken = spoken.trim();
  if (!trimmedSpoken) return base.slice(0, MAX_CHARS);
  if (!base.trim()) return trimmedSpoken.slice(0, MAX_CHARS);
  const needsSpace = !/\s$/.test(base);
  return `${base}${needsSpace ? " " : ""}${trimmedSpoken}`.slice(0, MAX_CHARS);
}

function MicIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

export default function HomePage() {
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [exampleIndex, setExampleIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [session, setSession] = useState<RoastSession | null>(null);
  const [inArena, setInArena] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const basePitchRef = useRef("");
  const finalSpokenRef = useRef("");

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!showHowItWorks) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowHowItWorks(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHowItWorks]);

  useEffect(() => {
    if (!session?.id || !inArena) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    const id = session.id;

    async function pullSession(): Promise<RoastSession | null> {
      const res = await fetch(`/api/roast/${id}`);
      if (!res.ok) return null;
      const data = (await res.json()) as RoastSession;
      if (!cancelled) setSession(data);
      return data;
    }

    const es = new EventSource(`/api/roast/${id}/stream`);
    const handler = (e: MessageEvent) => {
      if (cancelled) return;
      setSession(JSON.parse(e.data) as RoastSession);
    };
    es.addEventListener("snapshot", handler);
    es.addEventListener("message", handler);
    es.addEventListener("verdict", handler);
    es.addEventListener("email", handler);
    es.addEventListener("status", (e) => {
      if (cancelled) return;
      const data = JSON.parse((e as MessageEvent).data) as RoastSession;
      setSession(data);
      if (data.status !== "running") {
        es.close();
        if (pollTimer) clearInterval(pollTimer);
      }
    });

    void pullSession();
    pollTimer = setInterval(() => {
      void pullSession().then((data) => {
        if (data && data.status !== "running" && pollTimer) {
          clearInterval(pollTimer);
          es.close();
        }
      });
    }, 2000);

    return () => {
      cancelled = true;
      es.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [session?.id, inArena]);

  function focusMic() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => textareaRef.current?.focus(), 350);
  }

  function stopVoicePitch() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function startVoicePitch() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setError("voice pitch needs Chrome, Edge, or Safari");
      return;
    }
    setError("");
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    basePitchRef.current = pitch;
    finalSpokenRef.current = "";
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      let finals = finalSpokenRef.current;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finals = `${finals} ${chunk}`.trim();
        else interim = `${interim} ${chunk}`.trim();
      }
      finalSpokenRef.current = finals;
      setPitch(joinPitchParts(basePitchRef.current, `${finals} ${interim}`.trim()));
    };
    recognition.onerror = (event: { error: string }) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("mic blocked — allow microphone access to record your pitch");
        return;
      }
      setError("couldn't hear that — try the mic again");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      textareaRef.current?.focus();
    } catch {
      setError("mic is busy — tap stop, then try again");
      setIsListening(false);
    }
  }

  function loadExample() {
    if (isListening) stopVoicePitch();
    const nextIndex = (exampleIndex + 1) % EXAMPLES.length;
    setExampleIndex(nextIndex);
    setPitch(EXAMPLES[nextIndex].pitch.slice(0, MAX_CHARS));
  }

  function resetArena() {
    setInArena(false);
    setSession(null);
    setSubmitting(false);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pitch.trim()) return;
    if (isListening) stopVoicePitch();
    setSubmitting(true);
    setError("");
    // Unlock audio during the click gesture so the bell can play after fetch.
    void unlockAudio();
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "the bell jammed — try again");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { id: string; mock?: boolean };
      void playRingBell();
      setSession({
        id: data.id,
        pitch: pitch.trim(),
        status: "running",
        messages: [],
        createdAt: Date.now(),
        mock: Boolean(data.mock),
      });
      setInArena(true);
      setSubmitting(false);
    } catch {
      setError("couldn't reach the arena");
      setSubmitting(false);
    }
  }

  return (
    <div className={inArena ? "h-dvh max-w-[100vw] overflow-hidden" : "min-h-screen overflow-x-hidden"}>
      <AnimatePresence mode="wait">
        {inArena && session ? (
          <ArenaExperience key={session.id} session={session} onReset={resetArena} />
        ) : (
          <motion.div
            key="landing"
            className="overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
            transition={{ duration: 0.55 }}
          >
            <section className="stage-scene min-h-screen flex flex-col">
              <div className="stage-scene__image" aria-hidden />
              <div className="stage-scene__haze" aria-hidden />
              <div className="spotlight-beam spotlight-beam--left" aria-hidden />
              <div className="spotlight-beam spotlight-beam--right" aria-hidden />

              <div className="stage-scene__content flex flex-col min-h-screen">
                <header className="flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5">
                  <div className="font-display text-4xl sm:text-5xl tracking-[0.08em]">
                    <span className="text-[var(--red)]">ROAST</span>{" "}
                    <span className="text-[var(--cream)]">ROOM</span>
                  </div>

                  <span className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowHowItWorks(true)}
                      className="px-4 py-2 text-lg uppercase text-[var(--cream)] hover:text-[var(--gold)] transition-colors"
                    >
                      How It Works
                    </button>
                    <button type="button" onClick={focusMic} className="btn-enter px-4 py-2 text-lg uppercase">
                      Enter The Ring
                    </button>
                  </span>
                </header>

                <div className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-16 pt-6 flex flex-row justify-between items-center">
                  <span className="flex flex-col items-start justify-center">
                    <p className="font-mono-app text-[11px] tracking-[0.28em] uppercase text-[var(--gold)] mb-4">
                      Live startup battle show
                    </p>
                    <h1 className="marquee-title font-display text-[clamp(3.8rem,14vw,8rem)] leading-[0.85] text-[var(--cream)] mb-5">
                      ENTER
                      <br />
                      <span className="text-[var(--red)]">THE RING</span>
                    </h1>
                    <p className="text-[var(--text-dim)] text-base sm:text-lg max-w-lg leading-relaxed mb-8">
                      Drop your pitch. Three judges surround the stage. One lights up at a time.
                      The verdict hits like a final bell.
                    </p>
                  </span>

                  <form ref={formRef} onSubmit={handleSubmit} className="mic-panel w-1/3 h-auto p-4 sm:p-5 max-h-82 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[var(--gold)]">
                        <MicIcon className="w-4 h-4" />
                        <span className="font-poster uppercase tracking-[0.2em] text-xs">
                          Step up to the mic
                        </span>
                      </div>
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={() => (isListening ? stopVoicePitch() : startVoicePitch())}
                          className={`inline-flex items-center gap-2 font-mono-app text-[10px] tracking-[0.16em] uppercase px-2.5 py-1.5 border ${isListening
                            ? "border-[var(--red)] text-[var(--red)]"
                            : "border-white/15 text-[var(--text-dim)]"
                            }`}
                        >
                          {isListening ? (
                            <>
                              <StopIcon className="w-3 h-3" /> Listening
                            </>
                          ) : (
                            <>
                              <MicIcon className="w-3.5 h-3.5" /> Record
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value.slice(0, MAX_CHARS))}
                      placeholder="Type or record your startup pitch…"
                      rows={5}
                      maxLength={MAX_CHARS}
                      className="w-full bg-black/35 border border-white/10 px-3 py-3 text-sm outline-none resize-none placeholder:text-[var(--text-faint)] focus:border-[var(--red)] text-[var(--cream)]"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono-app text-[11px] text-[var(--text-faint)]">
                        {pitch.length} / {MAX_CHARS}
                      </span>
                      <button
                        type="button"
                        onClick={loadExample}
                        className="font-mono-app text-[11px] text-[var(--text-dim)] hover:text-[var(--gold)]"
                      >
                        Try an example →
                      </button>
                    </div>
                    {error && <p className="font-mono-app text-xs text-[var(--red)]">{error}</p>}
                    <button
                      type="submit"
                      disabled={submitting || !pitch.trim()}
                      className="btn-enter w-full py-3.5 text-xl uppercase flex items-center justify-center gap-2"
                    >
                      <MicIcon className="w-5 h-5" />
                      {submitting ? "Opening the arena…" : "Enter The Ring"}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/75"
              aria-label="Close how it works"
              onClick={() => setShowHowItWorks(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="how-it-works-title"
              className="relative z-10 w-full max-w-4xl max-h-[min(88vh,640px)] overflow-y-auto rounded-2xl border border-white/12 bg-[linear-gradient(180deg,#121018_0%,#0a090c_100%)] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="font-mono-app text-[10px] tracking-[0.28em] uppercase text-[var(--gold)] mb-2">
                    House rules
                  </p>
                  <h2
                    id="how-it-works-title"
                    className="font-display text-4xl sm:text-5xl leading-none tracking-wide text-[var(--cream)]"
                  >
                    How It Works
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks(false)}
                  className="shrink-0 font-poster uppercase text-[11px] tracking-[0.18em] text-[var(--text-dim)] hover:text-[var(--cream)] border border-white/15 px-3 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>

              <ol className="space-y-5">
                {HOW_IT_WORKS_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="font-display text-2xl leading-none text-[var(--red)] w-8 shrink-0 pt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-poster uppercase text-[12px] tracking-[0.18em] text-[var(--cream)] mb-1">
                        {step.title}
                      </p>
                      <p className="text-sm text-[var(--text-dim)] leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => {
                  setShowHowItWorks(false);
                  focusMic();
                }}
                className="btn-enter w-full mt-8 py-3.5 text-lg uppercase"
              >
                Got it — Enter The Ring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
