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
  const busyRef = useRef(false);
  const mutedRef = useRef(muted);
  const cancelledRef = useRef(false);
  const pulseIdRef = useRef(0);
  mutedRef.current = muted;

  useEffect(() => {
    warmSpeechVoices();
    cancelledRef.current = false;
    setIntroReady(false);
    setVisibleCount(0);
    setSpeakingIndex(-1);
    setQueueTick(0);
    setCrowdPulse(null);
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
    if (visibleCount >= session.messages.length) return;
    const message = session.messages[visibleCount];
    if (!message) return;

    const index = visibleCount;
    busyRef.current = true;
    setSpeakingIndex(index);
    setVisibleCount(index + 1);

    const shouldSting =
      message.phase === "roast" ||
      message.phase === "rebuttal" ||
      message.phase === "founder";

    void (async () => {
      stopRoastReactionSfx();

      const speechPromise = speakRoastLine(message.body, {
        personaId: message.personaId,
        muted: mutedRef.current,
      });

      const reactionPromise = shouldSting
        ? wait(SFX_AFTER_SPEECH_MS).then(() => {
            if (cancelledRef.current) return;
            const reaction = classifyRoastReaction(message.body, message.personaId);
            pulseIdRef.current += 1;
            setCrowdPulse({ id: pulseIdRef.current, reaction });
            if (mutedRef.current) return;
            return playRoastReactionSfx(message.body, {
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
  }, [session.messages, session.messages.length, visibleCount, queueTick, introReady]);

  useEffect(() => {
    if (muted) {
      cancelSpeech();
      stopRoastReactionSfx();
    }
  }, [muted]);

  const visibleMessages = session.messages.slice(0, visibleCount);
  const waitingOnSpeech = speakingIndex !== -1;
  const allLinesPresented =
    introReady && visibleCount >= session.messages.length && !waitingOnSpeech;
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
  };
}
