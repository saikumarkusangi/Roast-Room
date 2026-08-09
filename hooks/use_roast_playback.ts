"use client";

import { useEffect, useRef, useState } from "react";
import type { RoastMessage, RoastSession } from "@/lib/roastStore";
import {
  classifyRoastReaction,
  playRoastReactionSfx,
  stopRoastReactionSfx,
  type RoastReaction,
} from "@/lib/roast_sfx";
import { cancelSpeech, speakRoastLine, warmSpeechVoices } from "@/lib/speech";

/** Pause after the enter-ring bell before the first roast line. */
const POST_BELL_DELAY_MS = 2800;
/** Play reaction SFX a few seconds into the spoken roast. */
const SFX_AFTER_SPEECH_MS = 2500;

export type CrowdPulse = {
  id: number;
  reaction: RoastReaction;
};

type PlaybackState = {
  visibleMessages: RoastMessage[];
  speakingIndex: number;
  canShowVerdict: boolean;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  /** False while waiting out the post-bell pause. */
  introReady: boolean;
  /** Crowd emoji burst keyed to each roast reaction beat. */
  crowdPulse: CrowdPulse | null;
  /** True when playback is paused for the founder's live mic reply. */
  awaitingReply: boolean;
  /** Default / AI founder line available while waiting. */
  pendingFounderLine: string | null;
  /** Commit the user's spoken (or typed) defense and resume. */
  submitFounderReply: (reply: string) => void;
  /** Skip mic and use the scripted/AI founder line. */
  skipFounderReply: () => void;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useRoastPlayback(session: RoastSession): PlaybackState {
  const [visibleCount, setVisibleCount] = useState(0);
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [queueTick, setQueueTick] = useState(0);
  const [muted, setMuted] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [crowdPulse, setCrowdPulse] = useState<CrowdPulse | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [founderReply, setFounderReply] = useState<string | null>(null);
  const [replyIsLive, setReplyIsLive] = useState(false);
  const busyRef = useRef(false);
  const mutedRef = useRef(muted);
  const cancelledRef = useRef(false);
  const pulseIdRef = useRef(0);
  const founderReplyRef = useRef<string | null>(null);
  const replyIsLiveRef = useRef(false);
  mutedRef.current = muted;
  founderReplyRef.current = founderReply;
  replyIsLiveRef.current = replyIsLive;

  useEffect(() => {
    warmSpeechVoices();
    cancelledRef.current = false;
    setIntroReady(false);
    setVisibleCount(0);
    setSpeakingIndex(-1);
    setQueueTick(0);
    setCrowdPulse(null);
    setAwaitingReply(false);
    setFounderReply(null);
    setReplyIsLive(false);
    founderReplyRef.current = null;
    replyIsLiveRef.current = false;
    busyRef.current = false;

    const timer = window.setTimeout(() => {
      if (!cancelledRef.current) setIntroReady(true);
    }, POST_BELL_DELAY_MS);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timer);
      cancelSpeech();
      stopRoastReactionSfx();
      busyRef.current = false;
    };
  }, [session.id]);

  useEffect(() => {
    if (!introReady) return;
    if (busyRef.current) return;
    if (awaitingReply) return;
    if (visibleCount >= session.messages.length) return;
    const message = session.messages[visibleCount];
    if (!message) return;

    if (message.phase === "founder" && founderReplyRef.current === null) {
      setAwaitingReply(true);
      return;
    }

    const index = visibleCount;
    busyRef.current = true;
    setSpeakingIndex(index);
    setVisibleCount(index + 1);

    const shouldSting =
      message.phase === "roast" ||
      message.phase === "rebuttal" ||
      message.phase === "founder";

    const lineBody =
      message.phase === "founder" && founderReplyRef.current
        ? founderReplyRef.current
        : message.body;

    const skipTts = message.phase === "founder" && replyIsLiveRef.current;

    void (async () => {
      stopRoastReactionSfx();

      const speechPromise = skipTts
        ? wait(Math.min(4200, Math.max(1800, lineBody.split(/\s+/).length * 280)))
        : speakRoastLine(lineBody, {
            personaId: message.personaId,
            muted: mutedRef.current,
          });

      const reactionPromise = shouldSting
        ? wait(SFX_AFTER_SPEECH_MS).then(() => {
            if (cancelledRef.current) return;
            const reaction = classifyRoastReaction(lineBody, message.personaId);
            pulseIdRef.current += 1;
            setCrowdPulse({ id: pulseIdRef.current, reaction });
            if (mutedRef.current) return;
            return playRoastReactionSfx(lineBody, {
              personaId: message.personaId,
              muted: mutedRef.current,
              volume: 0.7,
            });
          })
        : Promise.resolve();

      await Promise.all([speechPromise, reactionPromise]);
      await wait(400);

      if (cancelledRef.current) return;
      setSpeakingIndex(-1);
      busyRef.current = false;
      setQueueTick((tick) => tick + 1);
    })();
  }, [
    session.messages,
    session.messages.length,
    visibleCount,
    queueTick,
    introReady,
    awaitingReply,
  ]);

  useEffect(() => {
    if (muted) {
      cancelSpeech();
      stopRoastReactionSfx();
    }
  }, [muted]);

  function submitFounderReply(reply: string) {
    const cleaned = reply.trim();
    if (!cleaned) return;
    founderReplyRef.current = cleaned;
    replyIsLiveRef.current = true;
    setFounderReply(cleaned);
    setReplyIsLive(true);
    setAwaitingReply(false);
    setQueueTick((tick) => tick + 1);
  }

  function skipFounderReply() {
    const pending = session.messages.find((item) => item.phase === "founder");
    const fallback = pending?.body?.trim() || "I'll own the gaps — and prove the wedge in week one.";
    founderReplyRef.current = fallback;
    replyIsLiveRef.current = false;
    setFounderReply(fallback);
    setReplyIsLive(false);
    setAwaitingReply(false);
    setQueueTick((tick) => tick + 1);
  }

  const pendingFounder =
    session.messages.find((item) => item.phase === "founder") ?? null;

  const visibleMessages = session.messages.slice(0, visibleCount).map((message) => {
    if (message.phase === "founder" && founderReply) {
      return { ...message, body: founderReply };
    }
    return message;
  });
  const waitingOnSpeech = speakingIndex !== -1;
  const allLinesPresented =
    introReady &&
    visibleCount >= session.messages.length &&
    !waitingOnSpeech &&
    !awaitingReply;
  const canShowVerdict =
    Boolean(session.verdict) &&
    (session.status === "done" || session.status === "error") &&
    allLinesPresented;

  return {
    visibleMessages,
    speakingIndex,
    canShowVerdict,
    muted,
    setMuted,
    introReady,
    crowdPulse,
    awaitingReply,
    pendingFounderLine: pendingFounder?.body ?? null,
    submitFounderReply,
    skipFounderReply,
  };
}
