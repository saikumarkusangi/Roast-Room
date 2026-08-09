"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { VerdictOrb } from "@/components/arena/VerdictOrb";
import { DialogueBanner } from "@/components/arena/DialogueBanner";
import { FloatingReactions } from "@/components/arena/FloatingReactions";
import { useRoastPlayback } from "@/hooks/use_roast_playback";
import { useVoiceReply } from "@/hooks/use_voice_reply";
import { type ArenaPersonaId } from "@/lib/arena";
import { cancelSpeech } from "@/lib/speech";
import type { RoastSession } from "@/lib/roastStore";

type ArenaExperienceProps = {
  session: RoastSession;
  onReset: () => void;
};

const POV_BACKGROUNDS: Record<"stage" | ArenaPersonaId, string> = {
  stage: "/arena-ring-bg.png",
  vc: "/pov-investor.png",
  competitor: "/pov-competitor.png",
  user: "/pov-user.png",
};

export function ArenaExperience({ session, onReset }: ArenaExperienceProps) {
  const {
    visibleMessages,
    speakingIndex,
    canShowVerdict,
    muted,
    setMuted,
    introReady,
    crowdPulse,
    awaitingReply,
    submitFounderReply,
    skipFounderReply,
  } = useRoastPlayback(session);
  const {
    isSupported,
    isListening,
    draft,
    error: voiceError,
    startListening,
    stopListening,
    clearDraft,
  } = useVoiceReply();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.classList.add("arena-lock");
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.classList.remove("arena-lock");
    };
  }, []);

  useEffect(() => {
    if (!awaitingReply) {
      stopListening();
      clearDraft();
    }
  }, [awaitingReply, stopListening, clearDraft]);

  const currentMessage =
    speakingIndex >= 0
      ? visibleMessages[speakingIndex] ?? session.messages[speakingIndex] ?? null
      : visibleMessages[visibleMessages.length - 1] ?? null;

  const activeSpeaker: ArenaPersonaId | "founder" | null = (() => {
    if (canShowVerdict) return null;
    if (awaitingReply) return "founder";
    if (!currentMessage) return null;
    if (currentMessage.phase === "founder") return "founder";
    if (
      currentMessage.personaId === "vc" ||
      currentMessage.personaId === "competitor" ||
      currentMessage.personaId === "user"
    ) {
      return currentMessage.personaId;
    }
    return null;
  })();

  const povKey: "stage" | ArenaPersonaId =
    activeSpeaker === "vc" || activeSpeaker === "competitor" || activeSpeaker === "user"
      ? activeSpeaker
      : "stage";

  const dialogueText = useMemo(() => {
    if (canShowVerdict) return undefined;
    if (awaitingReply) return draft || undefined;
    if (!currentMessage) return undefined;
    if (
      currentMessage.phase === "roast" ||
      currentMessage.phase === "rebuttal" ||
      currentMessage.phase === "founder"
    ) {
      return currentMessage.body;
    }
    return undefined;
  }, [awaitingReply, canShowVerdict, currentMessage, draft]);

  function handleReset() {
    stopListening();
    cancelSpeech();
    onReset();
  }

  function handleMicToggle() {
    if (isListening) stopListening();
    else startListening();
  }

  function handleSendReply() {
    if (isListening) stopListening();
    const text = draft.trim();
    if (!text) return;
    submitFounderReply(text);
    clearDraft();
  }

  const statusLabel = (() => {
    if (awaitingReply) return isListening ? "Your turn · Recording" : "Your turn · Reply";
    if (!introReady) return "Bell";
    if (speakingIndex >= 0) return "Speaking";
    if (session.status === "running") return "On Air";
    if (session.status === "done") return "Final";
    return "Offline";
  })();

  return (
    <motion.section
      className="fixed inset-0 z-50 h-dvh w-screen max-w-[100vw] overflow-hidden overscroll-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={povKey}
            className="arena-pov-bg absolute inset-0"
            style={{ backgroundImage: `url(${POV_BACKGROUNDS[povKey]})` }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <div className="arena-ring-haze" />
        <div className="spotlight-beam spotlight-beam--left" />
        <div className="spotlight-beam spotlight-beam--right" />
      </div>

      <FloatingReactions pulse={crowdPulse} />

      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 sm:px-8 py-4">
        <div className="font-display text-4xl tracking-[0.08em]">
          <span className="text-[var(--red)]">ROAST</span>{" "}
          <span className="text-[var(--cream)]">ROOM</span>
        </div>
        <div className="flex items-center gap-3 font-poster uppercase text-[11px] tracking-[0.22em] text-[var(--text-dim)]">
          <span
            className={`w-2 h-2 rounded-full ${session.status === "running" || speakingIndex >= 0 || awaitingReply ? "live-dot bg-[var(--red)]" : "bg-white/30"}`}
          />
          {session.mock ? "Mock · " : ""}
          {statusLabel}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 text-[var(--cream)] hover:border-white/30 hover:bg-black/55 transition-colors"
            aria-pressed={muted}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MuteIcon className="h-7 w-7 sm:h-8 sm:w-8" /> : <VolumeIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 text-[var(--cream)] hover:border-[var(--red)]/50 hover:text-[var(--red)] hover:bg-black/55 transition-colors"
            aria-label="Exit arena"
            title="Exit arena"
          >
            <ExitIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 pb-6 pt-16 px-4 sm:px-8 flex flex-col items-center justify-end gap-5 pointer-events-none">
        {!canShowVerdict && (
          <div className="w-full pointer-events-auto">
            <DialogueBanner
              speakerId={activeSpeaker}
              text={
                awaitingReply && !draft
                  ? "Hit the mic and defend your pitch."
                  : dialogueText
              }
              live={awaitingReply && Boolean(draft)}
            />
          </div>
        )}

        {awaitingReply && !canShowVerdict && (
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={!isSupported}
              className={`relative inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-2 transition-colors ${
                isListening
                  ? "border-[var(--red)] bg-[var(--red)] text-white"
                  : "border-[var(--gold)] bg-black/50 text-[var(--gold)] hover:bg-black/70"
              } disabled:opacity-40`}
              aria-pressed={isListening}
              aria-label={isListening ? "Stop recording reply" : "Record reply"}
              title={isListening ? "Stop recording" : "Record your reply"}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full border-2 border-[var(--red)] animate-ping opacity-40" />
              )}
              <MicIcon className="h-9 w-9 sm:h-11 sm:w-11 relative z-10" />
            </button>
            <p className="font-poster uppercase text-[11px] tracking-[0.22em] text-[var(--cream)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {isListening ? "Listening… tap to stop" : isSupported ? "Tap to reply" : "Voice not supported"}
            </p>
            {voiceError && (
              <p className="font-mono-app text-xs text-[var(--red)]">{voiceError}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSendReply}
                disabled={!draft.trim()}
                className="btn-enter px-5 py-2.5 text-xl uppercase disabled:opacity-40"
              >
                Send Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  skipFounderReply();
                  clearDraft();
                }}
                className="font-poster px-10 py-2.5 border border-white/15 bg-black/35 text-xl uppercase text-[var(--cream)] hover:border-[var(--red)]/50 hover:text-[var(--red)] hover:bg-black/55 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>

      {session.status === "error" && session.error && (
        <div className="absolute bottom-6 inset-x-0 z-40 px-5 text-center">
          <p className="inline-block rounded-full border border-[var(--red)]/40 bg-black/50 px-4 py-2 text-sm text-[var(--red)]">
            {session.error}
          </p>
        </div>
      )}

      <AnimatePresence>
        {canShowVerdict && session.verdict && (
          <VerdictOrb verdict={session.verdict} onClose={handleReset} />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function MicIcon({ className = "h-6 w-6" }: { className?: string }) {
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

function VolumeIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4h3.2L12 18V6L7.2 10H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 9.2a3.6 3.6 0 0 1 0 5.6M17.8 7a6.5 6.5 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MuteIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4h3.2L12 18V6L7.2 10H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5 20.5 14.5M20.5 9.5 16 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExitIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 8.5 18.5 12 14 15.5M18.2 12H9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
