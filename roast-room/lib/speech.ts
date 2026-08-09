export type SpeakPersonaId = "vc" | "competitor" | "user" | "founder" | "system";

type SpeakOptions = {
  personaId?: SpeakPersonaId | string;
  muted?: boolean;
};

function estimateReadMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4500, Math.round(words * 420) + 1200);
}

function pickVoice(personaId: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : voices;
  if (personaId === "vc") {
    return pool.find((v) => /male|daniel|alex|david|google uk english male/i.test(v.name)) ?? pool[0];
  }
  if (personaId === "competitor") {
    return pool.find((v) => /mark|fred|google us english|microsoft david/i.test(v.name)) ?? pool[Math.min(1, pool.length - 1)];
  }
  if (personaId === "user") {
    return (
      pool.find((v) => /female|samantha|karen|victoria|zira|google us english female/i.test(v.name)) ??
      pool[Math.min(2, pool.length - 1)]
    );
  }
  return pool[0];
}

function voiceParams(personaId: string): { rate: number; pitch: number } {
  if (personaId === "vc") return { rate: 0.92, pitch: 0.85 };
  if (personaId === "competitor") return { rate: 1.0, pitch: 0.9 };
  if (personaId === "user") return { rate: 0.96, pitch: 1.15 };
  if (personaId === "founder") return { rate: 0.98, pitch: 1.0 };
  return { rate: 0.95, pitch: 1 };
}

export function cancelSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/** Speaks text and resolves after speech ends, with a minimum on-screen dwell time. */
export function speakRoastLine(text: string, options: SpeakOptions = {}): Promise<void> {
  const minMs = estimateReadMs(text);
  const started = Date.now();

  const finish = (resolve: () => void) => {
    const elapsed = Date.now() - started;
    // Always leave a beat on screen after audio (or after silent dwell).
    const linger = Math.max(1800, minMs - elapsed);
    window.setTimeout(resolve, linger);
  };

  if (typeof window === "undefined") {
    return new Promise((resolve) => window.setTimeout(resolve, minMs));
  }

  if (options.muted || !window.speechSynthesis) {
    return new Promise((resolve) => window.setTimeout(resolve, minMs));
  }

  return new Promise((resolve) => {
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const personaId = options.personaId ?? "system";
    const params = voiceParams(personaId);
    utterance.rate = params.rate;
    utterance.pitch = params.pitch;
    const voice = pickVoice(personaId);
    if (voice) utterance.voice = voice;

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      finish(resolve);
    };

    utterance.onend = settle;
    utterance.onerror = settle;
    window.speechSynthesis.speak(utterance);

    // Safety net if the browser never fires onend
    window.setTimeout(settle, minMs + 8000);
  });
}

export function warmSpeechVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
