"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, FormEvent } from "react";
import { ArenaExperience } from "@/components/arena/ArenaExperience";
import { ARENAS, getArena, type ArenaId } from "@/lib/arenas";
import { playRingBell, unlockAudio } from "@/lib/ring_bell";
import { startLobbyAmbience, stopLobbyAmbience } from "@/lib/lobby_ambience";
import type { RoastSession } from "@/lib/roastStore";

const MAX_CHARS = 1500;

const HOW_IT_WORKS_STEPS = [
  {
    title: "Choose your arena",
    body: "Startup, Resume, Design, Marketing, Content, App — pick what you want judged.",
  },
  {
    title: "Submit",
    body: "Type or record your submission. The three experts for that arena hear every word.",
  },
  {
    title: "Three experts debate",
    body: "They take turns roasting. Camera cuts to their POV while they speak.",
  },
  {
    title: "Defend live",
    body: "Grab the mic and reply — or skip and use the house defense.",
  },
  {
    title: "Verdict → Fix It",
    body: "APPROVED or REJECTED stamps the call, with a strength, weakness, and gut punch.",
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

function HeadphonesIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 13a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 13v4.2A1.8 1.8 0 0 0 5.8 19H7a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H4Zm16 0h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.2A1.8 1.8 0 0 0 20 17.2V13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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
  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>("startup");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const basePitchRef = useRef("");
  const finalSpokenRef = useRef("");

  const selectedArena = getArena(selectedArenaId);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!showHowItWorks && !showThemeMenu && !showDisclaimer) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (showDisclaimer) return;
      setShowHowItWorks(false);
      setShowThemeMenu(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHowItWorks, showThemeMenu, showDisclaimer]);

  function continueFromDisclaimer() {
    setShowDisclaimer(false);
    setShowThemeMenu(true);
    void unlockAudio().then(() => {
      void startLobbyAmbience();
    });
  }

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

  function selectArena(arenaId: ArenaId) {
    setSelectedArenaId(arenaId);
    setExampleIndex(-1);
    setShowThemeMenu(false);
    setError("");
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
        setError("mic blocked — allow microphone access");
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
    const examples = selectedArena.examples;
    if (examples.length === 0) return;
    const nextIndex = (exampleIndex + 1) % examples.length;
    setExampleIndex(nextIndex);
    setPitch(examples[nextIndex].pitch.slice(0, MAX_CHARS));
  }

  function resetArena() {
    setInArena(false);
    setSession(null);
    setSubmitting(false);
    setError("");
    void startLobbyAmbience();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pitch.trim()) return;
    if (isListening) stopVoicePitch();
    setSubmitting(true);
    setError("");
    void unlockAudio();
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch, arenaId: selectedArenaId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "the bell jammed — try again");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { id: string; mock?: boolean; arenaId?: ArenaId };
      stopLobbyAmbience();
      void playRingBell();
      setSession({
        id: data.id,
        pitch: pitch.trim(),
        arenaId: data.arenaId ?? selectedArenaId,
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
              <div
                className="stage-scene__image"
                style={{ ["--stage-bg" as string]: `url(${selectedArena.landingBg})` }}
                aria-hidden
              />
              <div className="stage-scene__haze" aria-hidden />
              <div className="spotlight-beam spotlight-beam--left" aria-hidden />
              <div className="spotlight-beam spotlight-beam--right" aria-hidden />

              <div className="stage-scene__content flex flex-col min-h-screen">
                <header className="flex items-center justify-between gap-3 px-5 sm:px-8 lg:px-12 py-5">
                  <div className="font-display text-3xl sm:text-5xl tracking-[0.08em]">
                    <span className="text-[var(--red)]">ROAST</span>{" "}
                    <span className="text-[var(--cream)]">ROOM</span>
                  </div>

                  <span className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setShowThemeMenu(true)}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-lg uppercase text-[var(--cream)] hover:text-[var(--gold)] transition-colors"
                      aria-expanded={showThemeMenu}
                    >
                      Themes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHowItWorks(true)}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-lg uppercase text-[var(--cream)] hover:text-[var(--gold)] transition-colors"
                    >
                      How It Works
                    </button>
                  </span>
                </header>

                <div className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-16 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  <div className="max-w-2xl">
                    <p className="font-mono-app text-[11px] tracking-[0.28em] uppercase text-[var(--gold)] mb-4">
                      Put anything in the arena
                    </p>
                    <h1 className="marquee-title font-display text-[clamp(3rem,11vw,6.5rem)] leading-[0.88] text-[var(--cream)] mb-4">
                      YOUR IDEA.
                      <br />
                      <span className="text-[var(--red)]">THEIR HONESTY.</span>
                    </h1>
                    <p className="text-[var(--text-dim)] text-base sm:text-lg max-w-lg leading-relaxed">
                      Get brutally honest feedback from AI experts. Pick a theme, submit, and survive the jury.
                    </p>
                  </div>

                  <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="mic-panel w-full lg:w-[380px] shrink-0 p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[var(--gold)]">
                        <MicIcon className="w-4 h-4" />
                        <span className="font-poster uppercase tracking-[0.2em] text-xs">
                          {selectedArena.submitHint}
                        </span>
                      </div>
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={() => (isListening ? stopVoicePitch() : startVoicePitch())}
                          className={`inline-flex items-center gap-2 font-mono-app text-[10px] tracking-[0.16em] uppercase px-2.5 py-1.5 border ${
                            isListening
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
                      placeholder={selectedArena.placeholder}
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
                    <p className="font-poster uppercase text-[10px] tracking-[0.18em] text-white/50 text-center">
                      {selectedArena.emoji} {selectedArena.title} · {selectedArena.tagline}
                    </p>
                  </form>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="absolute inset-0 bg-black/90" aria-hidden />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="headphones-disclaimer-title"
              className="relative z-10 w-full max-w-md text-center rounded-2xl border border-white/12 bg-[linear-gradient(180deg,#16141c_0%,#0a090c_100%)] px-6 py-10 sm:px-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-black/40 text-[var(--gold)]">
                <HeadphonesIcon className="h-8 w-8" />
              </div>
              <p className="font-mono-app text-[10px] tracking-[0.28em] uppercase text-[var(--gold)] mb-3">
                Disclaimer
              </p>
              <h2
                id="headphones-disclaimer-title"
                className="font-display text-4xl sm:text-5xl leading-none tracking-wide text-[var(--cream)] mb-4"
              >
                Use Headphones
              </h2>
              <p className="text-[var(--text-dim)] text-sm sm:text-base leading-relaxed mb-8">
                For a better experience, put on headphones. The arena uses live voice, crowd reactions, and stage sound.
              </p>
              <button
                type="button"
                onClick={continueFromDisclaimer}
                className="btn-enter w-full py-3.5 text-lg uppercase"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showThemeMenu && (
          <motion.div
            className="fixed inset-0 z-[60] overflow-y-auto backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/80"
              aria-label="Close themes"
              onClick={() => setShowThemeMenu(false)}
            />
            <div className="relative z-10 min-h-full px-4 sm:px-8 py-10 sm:py-14 flex items-start justify-center">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="choose-arena-title"
                className="w-full max-w-6xl"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              >
                <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
                  <div>
                    <h2
                      id="choose-arena-title"
                      className="font-display text-4xl sm:text-6xl leading-none tracking-wide text-[var(--cream)]"
                    >
                      Choose Your Arena
                    </h2>
                    <p className="mt-3 font-poster uppercase text-[11px] sm:text-xs tracking-[0.22em] text-white/65">
                      Submit → 3 Experts Debate → Verdict → Fix It
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowThemeMenu(false)}
                    className="shrink-0 font-poster uppercase text-[11px] tracking-[0.18em] text-[var(--text-dim)] hover:text-[var(--cream)] border border-white/15 px-3 py-2 rounded-lg bg-black/40"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ARENAS.map((arena) => {
                    const isActive = arena.id === selectedArenaId;
                    return (
                      <button
                        key={arena.id}
                        type="button"
                        onClick={() => {
                          selectArena(arena.id);
                          setShowThemeMenu(false);
                        }}
                        className={`group relative overflow-hidden rounded-2xl border text-left transition-all min-h-[180px] sm:min-h-[200px] ${
                          isActive
                            ? "border-[var(--red)]/80 shadow-[0_0_36px_rgba(230,50,40,0.28)]"
                            : "border-white/12 hover:border-white/30"
                        }`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-500 group-hover:scale-110"
                          style={{ backgroundImage: `url(${arena.landingBg})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                        <div className="relative z-10 flex h-full min-h-[180px] sm:min-h-[200px] flex-col justify-end p-5">
                          <p className="text-3xl mb-2">{arena.emoji}</p>
                          <p className="font-display text-3xl sm:text-4xl leading-none text-[var(--cream)]">
                            {arena.shortTitle}
                          </p>
                          <p className="mt-3 font-poster uppercase text-[10px] sm:text-[11px] tracking-[0.16em] text-white/70">
                            {arena.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
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
                    Platform rules
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
