import type { ArenaId } from "@/lib/arenas";
import type { ArenaPersonaId } from "@/lib/arena";

/** Cloudinary-hosted arena imagery (CDN). */
export const ASSETS = {
  arenaStage:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273563/arena-stage_kubqiy.png",
  arenaRingBg:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273561/arena-ring-bg_ksirjm.png",
  themeDesign:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273565/theme-design_spzvkb.png",
  themeResume:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273566/theme-resume_vypvcu.png",
  themeMarketing:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273564/theme-marketing_gar8xj.png",
  themeContent:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273562/theme-content_rtkjbr.png",
  themeApp:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273561/theme-app_wwdfhp.png",
  povInvestor:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273565/pov-investor_br1ybe.png",
  povCompetitor:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273560/pov-competitor_v4ef3p.png",
  povUser:
    "https://res.cloudinary.com/drecccc2t/image/upload/v1786273569/pov-user_wdagxg.png",
} as const;

export type ArenaPovSpeaker = ArenaPersonaId | "founder";

type ArenaPovMap = Record<ArenaPovSpeaker, string>;

/** Per-arena shots shown while a judge or the submitter speaks. */
export const ARENA_POV: Record<ArenaId, ArenaPovMap> = {
  startup: {
    vc: ASSETS.povInvestor,
    competitor: ASSETS.povCompetitor,
    user: ASSETS.povUser,
    founder: "/pov-startup-founder.png",
  },
  design: {
    vc: "/pov-design-vc.png",
    competitor: "/pov-design-competitor.png",
    user: "/pov-design-user.png",
    founder: "/pov-design-founder.png",
  },
  resume: {
    vc: "/pov-resume-vc.png",
    competitor: "/pov-resume-competitor.png",
    user: "/pov-resume-user.png",
    founder: "/pov-resume-founder.png",
  },
  marketing: {
    vc: "/pov-marketing-vc.png",
    competitor: "/pov-marketing-competitor.png",
    user: "/pov-marketing-user.png",
    founder: "/pov-marketing-founder.png",
  },
  content: {
    vc: "/pov-content-vc.png",
    competitor: "/pov-content-competitor.png",
    user: "/pov-content-user.png",
    founder: "/pov-content-founder.png",
  },
  app: {
    vc: "/pov-app-vc.png",
    competitor: "/pov-app-competitor.png",
    user: "/pov-app-user.png",
    founder: "/pov-app-founder.png",
  },
};

export function getArenaPov(
  arenaId: ArenaId | string | undefined,
  speakerId: ArenaPovSpeaker,
): string {
  const key = (arenaId ?? "startup") as ArenaId;
  return ARENA_POV[key]?.[speakerId] ?? ARENA_POV.startup[speakerId];
}
