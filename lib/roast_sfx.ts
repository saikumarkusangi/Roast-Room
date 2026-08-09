export type RoastReaction = "worse" | "positive" | "laugh";

const SFX_URLS: Record<RoastReaction, string> = {
  worse: "https://cdn.pixabay.com/audio/2025/06/02/audio_0b6227c9d4.mp3",
  positive: "https://cdn.pixabay.com/audio/2021/08/04/audio_dc32f4ccaa.mp3",
  laugh: "https://cdn.pixabay.com/audio/2022/03/09/audio_cce81eae4a.mp3",
};

const LAUGH_PATTERNS =
  /\b(haha|lol|lmao|laugh|joke|joking|hilarious|cute defense|yawning|bored|seriously\?|as if|please)\b|😂|🤣/i;

const POSITIVE_PATTERNS =
  /\b(fair|concede|genuinely strong|strong point|impressed|respect|solid|clever|smart|promising|believe|potential|good defense|owns? the|at least)\b/i;

const WORSE_PATTERNS =
  /\b(kill|feature not a company|won't switch|tiny|died|naive|crowded|pass|no wedge|missing|don't trust|churn|not switching|waste|dead|fail|weak|no path|still waiting)\b/i;

/** Score roast text into crowd reaction buckets. */
export function classifyRoastReaction(
  text: string,
  personaId?: string
): RoastReaction {
  const body = text.trim();
  if (!body) return "worse";

  if (LAUGH_PATTERNS.test(body)) return "laugh";

  const positiveHit = POSITIVE_PATTERNS.test(body);
  const worseHit = WORSE_PATTERNS.test(body);

  if (personaId === "founder") {
    return positiveHit && !worseHit ? "positive" : worseHit ? "worse" : "positive";
  }

  if (positiveHit && !worseHit) return "positive";
  if (laughWorthMockery(body)) return "laugh";
  return "worse";
}

function laughWorthMockery(body: string): boolean {
  return /\b(cute|yawn|bored|already built|three years ago|feature dressed)\b/i.test(body);
}

const players = new Map<RoastReaction, HTMLAudioElement>();

function getPlayer(reaction: RoastReaction): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let audio = players.get(reaction);
  if (!audio) {
    audio = new Audio(SFX_URLS[reaction]);
    audio.preload = "auto";
    players.set(reaction, audio);
  }
  return audio;
}

/** Warm-load reaction SFX after a user gesture. */
export function preloadRoastSfx(): void {
  (Object.keys(SFX_URLS) as RoastReaction[]).forEach((key) => {
    getPlayer(key);
  });
}

/** Play crowd/reaction sting for a roast line. */
export async function playRoastReactionSfx(
  text: string,
  options: { personaId?: string; muted?: boolean; volume?: number } = {}
): Promise<RoastReaction> {
  const reaction = classifyRoastReaction(text, options.personaId);
  if (options.muted) return reaction;

  const audio = getPlayer(reaction);
  if (!audio) return reaction;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = options.volume ?? 0.65;
    await audio.play();
  } catch {
    // Ignore autoplay / decode errors.
  }
  return reaction;
}

export function stopRoastReactionSfx(): void {
  players.forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  });
}
