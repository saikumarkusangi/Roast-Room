export type ArenaId =
  | "startup"
  | "design"
  | "resume"
  | "marketing"
  | "content"
  | "app";

export type ArenaJudgeId = "vc" | "competitor" | "user";

export type ArenaJudge = {
  id: ArenaJudgeId;
  title: string;
  role: string;
  accent: string;
};

export type ArenaDefinition = {
  id: ArenaId;
  title: string;
  shortTitle: string;
  emoji: string;
  tagline: string;
  submitHint: string;
  placeholder: string;
  landingBg: string;
  ringBg: string;
  judges: readonly [ArenaJudge, ArenaJudge, ArenaJudge];
  examples: readonly { title: string; pitch: string }[];
  founderLabel: string;
  defensePrompt: string;
};

export const ARENAS: readonly ArenaDefinition[] = [
  {
    id: "startup",
    title: "Startup Roast",
    shortTitle: "Startup",
    emoji: "🚀",
    tagline: "Investor. Competitor. Customer.",
    submitHint: "Drop your startup pitch",
    placeholder: "Type or record your startup pitch…",
    landingBg: "/arena-stage.png",
    ringBg: "/arena-ring-bg.png",
    founderLabel: "The Founder",
    defensePrompt: "Hit the mic and defend your pitch.",
    judges: [
      { id: "vc", title: "The VC", role: "Sees 40 pitches a week", accent: "#e8b84a" },
      { id: "competitor", title: "The Rival", role: "Already shipped this", accent: "#e63228" },
      { id: "user", title: "Target Customer", role: "Won't switch", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "PawRush",
        pitch:
          "PawRush — book professional pet groomers on demand. Track arrival in real time, manage pet profiles, and pay through the app.",
      },
      {
        title: "CreatorHub",
        pitch:
          "CreatorHub — creators sell memberships, gated content, courses, and community access from a single platform with lower fees.",
      },
    ],
  },
  {
    id: "design",
    title: "Design Roast",
    shortTitle: "Design",
    emoji: "🎨",
    tagline: "Senior Designer. Creative Director. End User.",
    submitHint: "Describe the design or paste a critique brief",
    placeholder: "Describe your design, UI, or brand system…",
    landingBg: "/theme-design.png",
    ringBg: "/theme-design.png",
    founderLabel: "The Designer",
    defensePrompt: "Hit the mic and defend your design.",
    judges: [
      { id: "vc", title: "Senior Designer", role: "Obsessed with craft", accent: "#e8b84a" },
      { id: "competitor", title: "Creative Director", role: "Owns the brand", accent: "#e63228" },
      { id: "user", title: "End User", role: "Just wants it to work", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "Fintech App UI",
        pitch:
          "A dark-mode mobile banking app with neon charts, floating cards, and a bottom nav of 6 icons. Hero is a 3D coin animation.",
      },
    ],
  },
  {
    id: "resume",
    title: "Resume Roast",
    shortTitle: "Resume",
    emoji: "💼",
    tagline: "Recruiter. Hiring Manager. ATS Bot.",
    submitHint: "Paste your resume summary",
    placeholder: "Paste resume bullets, summary, or LinkedIn About…",
    landingBg: "/theme-resume.png",
    ringBg: "/theme-resume.png",
    founderLabel: "The Candidate",
    defensePrompt: "Hit the mic and defend your experience.",
    judges: [
      { id: "vc", title: "Recruiter", role: "6-second scan", accent: "#e8b84a" },
      { id: "competitor", title: "Hiring Manager", role: "Wants proof of impact", accent: "#e63228" },
      { id: "user", title: "ATS Bot", role: "Keyword match only", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "PM Resume",
        pitch:
          "Product Manager with 4 years experience. Led cross-functional teams. Passionate about users. Increased engagement. Responsible for roadmap and stakeholder management.",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing Roast",
    shortTitle: "Marketing",
    emoji: "📢",
    tagline: "CMO. Competitor. Target Customer.",
    submitHint: "Paste the ad, landing copy, or campaign",
    placeholder: "Paste your ad copy, landing page text, or campaign brief…",
    landingBg: "/theme-marketing.png",
    ringBg: "/theme-marketing.png",
    founderLabel: "The Marketer",
    defensePrompt: "Hit the mic and defend the campaign.",
    judges: [
      { id: "vc", title: "The CMO", role: "ROI or die", accent: "#e8b84a" },
      { id: "competitor", title: "Competitor", role: "Already outspent you", accent: "#e63228" },
      { id: "user", title: "Target Customer", role: "Scrolls past ads", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "SaaS Ad",
        pitch:
          "Headline: Revolutionize your workflow with AI. Body: Our platform helps teams do more with less. CTA: Start free trial today. No mention of price or who it's for.",
      },
    ],
  },
  {
    id: "content",
    title: "Content Roast",
    shortTitle: "Content",
    emoji: "🎬",
    tagline: "Creator. Subscriber. Algorithm.",
    submitHint: "Paste the script, hook, or title ideas",
    placeholder: "Paste your YouTube script, hook, or title…",
    landingBg: "/theme-content.png",
    ringBg: "/theme-content.png",
    founderLabel: "The Creator",
    defensePrompt: "Hit the mic and defend the content.",
    judges: [
      { id: "vc", title: "Creator", role: "Knows the game", accent: "#e8b84a" },
      { id: "competitor", title: "Subscriber", role: "Thumb ready to skip", accent: "#e63228" },
      { id: "user", title: "Algorithm", role: "Retention or bury", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "YouTube Hook",
        pitch:
          "Title: You won't believe what happened. Script opens with 'Hey guys welcome back to another video' then a 90-second intro before the point.",
      },
    ],
  },
  {
    id: "app",
    title: "App Roast",
    shortTitle: "App",
    emoji: "📱",
    tagline: "Product Manager. Competitor. User.",
    submitHint: "Describe the app or feature",
    placeholder: "Describe your app, feature set, or onboarding flow…",
    landingBg: "/theme-app.png",
    ringBg: "/theme-app.png",
    founderLabel: "The Builder",
    defensePrompt: "Hit the mic and defend the product.",
    judges: [
      { id: "vc", title: "Product Manager", role: "Scope vs value", accent: "#e8b84a" },
      { id: "competitor", title: "Competitor", role: "Shipped last quarter", accent: "#e63228" },
      { id: "user", title: "User", role: "Confused in onboarding", accent: "#6aa8ff" },
    ],
    examples: [
      {
        title: "Habit App",
        pitch:
          "A habit tracker with streaks, social feed, AI coach, widgets, and 14 onboarding screens asking for notifications before the first habit is created.",
      },
    ],
  },
] as const;

export function getArena(id: ArenaId | string | undefined): ArenaDefinition {
  return ARENAS.find((arena) => arena.id === id) ?? ARENAS[0];
}

export function isArenaId(value: string): value is ArenaId {
  return ARENAS.some((arena) => arena.id === value);
}
