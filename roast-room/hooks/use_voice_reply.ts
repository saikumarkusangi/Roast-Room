"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type VoiceReplyState = {
  isSupported: boolean;
  isListening: boolean;
  draft: string;
  error: string;
  startListening: () => void;
  stopListening: () => void;
  setDraft: (value: string) => void;
  clearDraft: () => void;
};

export function useVoiceReply(): VoiceReplyState {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalSpokenRef = useRef("");

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const clearDraft = useCallback(() => {
    setDraft("");
    finalSpokenRef.current = "";
    setError("");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setError("Voice reply needs Chrome, Edge, or Safari");
      return;
    }
    setError("");
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    finalSpokenRef.current = draft.trim();
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
      setDraft(`${finals}${interim ? ` ${interim}` : ""}`.trim());
    };
    recognition.onerror = (event: { error: string }) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("Mic blocked — allow microphone access");
        return;
      }
      setError("Couldn't hear that — try again");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Mic is busy — tap stop, then try again");
      setIsListening(false);
    }
  }, [draft]);

  return {
    isSupported,
    isListening,
    draft,
    error,
    startListening,
    stopListening,
    setDraft,
    clearDraft,
  };
}
