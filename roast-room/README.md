# The Roast Room

Paste a pitch. Three AI personas — a VC, a competitor, and your harshest target
user — tear it apart live, one after another, each reacting to what the last one
said. You get one shot to defend it as the founder. Then a scored verdict,
a build-or-kill call, and a screenshot-ready investor rejection email.

Built for [The Zerops Challenge](https://www.wemakedevs.org/hackathons/zerops).

## The flow

1. **Round 1 — The Roast**: The VC, The Competitor, and The Harshest User each
   attack the pitch in sequence, referencing specifics from the pitch and from
   what the previous persona just said.
2. **The Founder Fights Back**: one AI call defends the pitch using only what
   was actually stated, pushing back on the weakest attack.
3. **Final Word**: each of the three personas gets one short rebuttal line
   reacting to the founder's defense.
4. **Reality Check Scorecard**: a 6-axis score (market size, differentiation,
   distribution, timing, defensibility, revenue model) plus a blunt BUILD or
   KILL call.
5. **Investor Rejection Email**: a short, specific, screenshot-worthy decline
   email referencing the actual pitch.

Nine sequential LLM calls per roast (via OpenRouter), each one seeing the
growing transcript so the "debate" genuinely builds on itself — not nine
independent prompts wearing different hats.

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- Server-Sent Events for the live terminal stream (same pattern proven in
  earlier prototypes — no external pub/sub needed)
- Server-side calls through `@openrouter/sdk`, orchestrated sequentially
- In-memory session store (module-level Map + EventEmitter, pinned to
  `globalThis`) — fine for a hackathon demo, swap for Postgres/Redis for
  real persistence across restarts

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env — set OPENROUTER_API_KEY when you want live roasts
# MOCK_ROAST=true (default in development) uses a sample script, no tokens
npm run dev
```

Open http://localhost:3000, paste a pitch (or click "use an example"), and
watch the roast run — takes about a minute end to end with live API, or a few
seconds in mock mode.

## Deploy to Zerops

1. Create a Zerops project, add a Node.js service, connect this repo.
2. `zerops.yaml` is included — builds with `npm install && npm run build`,
   runs `npm run start` on port 3000.
3. **Set `OPENROUTER_API_KEY` as an environment variable on the Zerops
   service** — the app calls OpenRouter server-side and will error without
   it (the error message tells you exactly this if it's missing).
4. Zerops gives you a live URL once deployed.

## Submission checklist

- [ ] Deployed on Zerops with a live URL, `OPENROUTER_API_KEY` set
- [ ] Repo public (or shared privately with judges)
- [ ] Build post tagging @WeMakeDevs and @zeropsio, with:
  - project name + what it does
  - short demo video (paste a real pitch, let it roast, show the verdict
    and rejection email — that's the whole video)
  - link to the live deployment
  - how Zerops is used

## What's deliberately not in the MVP

Landing page roasts (URL input), Battle Mode (two pitches head to head), and
"Make It Win" (pivot suggestions) were scoped out to ship reliably in the time
available. The architecture supports all three as additional personas/calls
in the same orchestration pattern if you want to extend it later.
