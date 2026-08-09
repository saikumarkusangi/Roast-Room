const LOBBY_AMBIENCE_URL =
  "https://cdn.pixabay.com/audio/2026/07/04/audio_f7a903cbf3.mp3";

const LOBBY_VOLUME = 0.18;

let lobbyAudio: HTMLAudioElement | null = null;
let isPlaying = false;

function getLobbyAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!lobbyAudio) {
    lobbyAudio = new Audio(LOBBY_AMBIENCE_URL);
    lobbyAudio.preload = "auto";
    lobbyAudio.loop = true;
    lobbyAudio.volume = LOBBY_VOLUME;
  }
  return lobbyAudio;
}

/** Soft lobby bed — start after a user gesture (e.g. disclaimer Continue). */
export async function startLobbyAmbience(): Promise<void> {
  const audio = getLobbyAudio();
  if (!audio || isPlaying) return;
  try {
    audio.volume = LOBBY_VOLUME;
    audio.muted = false;
    if (audio.paused) {
      await audio.play();
    }
    isPlaying = true;
  } catch {
    // Autoplay blocked — ignore quietly.
  }
}

/** Stop when entering the ring (or leaving the lobby). */
export function stopLobbyAmbience(): void {
  const audio = getLobbyAudio();
  if (!audio) return; 
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers throw if not seekable yet.
  }
  isPlaying = false;
}
