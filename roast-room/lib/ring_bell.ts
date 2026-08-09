const RING_BELL_URL =
  "https://cdn.pixabay.com/audio/2025/10/16/audio_becf266b23.mp3";

let unlocked = false;
let sharedAudio: HTMLAudioElement | null = null;

function getBellAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(RING_BELL_URL);
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

/** Call from a click handler so later playRingBell() is allowed. */
export async function unlockAudio(): Promise<void> {
  const audio = getBellAudio();
  if (!audio) return;
  try {
    audio.muted = true;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    unlocked = true;
    const { preloadRoastSfx } = await import("@/lib/roast_sfx");
    preloadRoastSfx();
  } catch {
    // Browser may still require a later gesture.
  }
}

/** Ring bell when entering the arena. */
export async function playRingBell(): Promise<void> {
  const audio = getBellAudio();
  if (!audio) return;
  try {
    if (!unlocked) {
      await unlockAudio();
    }
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 1;
    await audio.play();
  } catch {
    // Autoplay may still be blocked — ignore quietly.
  }
}
