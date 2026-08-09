# Roast Room

**Put anything in the arena.**

Get brutally honest feedback from AI experts. Choose an arena — Startup, Resume, Design, Marketing, Content, or App — then three judges tear your submission apart live. Defend with your mic. Walk out with a scored verdict and an APPROVED / REJECTED stamp.

Built for [The Zerops Challenge](https://www.wemakedevs.org/hackathons/zerops) (Aug 8–9, 2026) — idea to live app in one weekend on real infrastructure.

> *Your idea. Their honesty.*

## Why this for Zerops

Zerops Challenge asks for a **working product with a live URL**, meaningfully deployed on Zerops — not a local demo. Roast Room is a full Next.js app:

- Public SSR frontend + API routes on one Node service
- Live arena stream over Server-Sent Events
- Server-side LLM orchestration via OpenRouter
- Deployed with the included `zerops.yaml` (build → run on port 3000)

That maps cleanly to “frontend + API on Zerops” with a real public URL for judging.

## Product

### Arenas

| Arena | Jury |
| --- | --- |
| **Startup** | Investor · Competitor · Customer |
| **Design** | Senior Designer · Creative Director · End User |
| **Resume** | Recruiter · Hiring Manager · ATS Bot |
| **Marketing** | CMO · Competitor · Target Customer |
| **Content** | Creator · Subscriber · Algorithm |
| **App** | Product Manager · Competitor · User |

### Flow

1. **Headphones disclaimer** → soft lobby ambience  
2. **Choose your arena** (theme picker)  
3. **Submit** — type or record your pitch / resume / copy / script  
4. **Enter the ring** — bell, cinematic POV cuts, floating crowd reactions  
5. **Three experts debate** — sequential roasts that react to each other  
6. **Your defense** — live mic reply (or skip)  
7. **Verdict** — scorecard + APPROVED / REJECTED stamp  

Universal loop: **Submit → 3 Experts Debate → Verdict → Fix It**

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS 4 + Framer Motion  
- **SSE** for live roast progress (`/api/roast/[id]/stream`)  
- **OpenRouter** (`@openrouter/sdk`) for sequential debate calls  
- In-memory session store (`globalThis` Map + EventEmitter) — fine for a hackathon demo  
- Client TTS, reaction SFX, lobby ambience, ring bell  

## Run locally

```bash
npm install
cp .env.example .env
# Set OPENROUTER_API_KEY for live roasts
# MOCK_ROAST=true (default in development) = canned script, no tokens
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Env | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Live LLM roasts (required for production) |
| `OPENROUTER_MODEL` | Optional model override |
| `MOCK_ROAST` | `true` / `false` — mock script vs OpenRouter |

## Deploy to Zerops

1. Create a Zerops project → Node.js service → connect this repo.  
2. `zerops.yaml` builds with `npm install && npm run build`, runs `npm run start` on **port 3000**.  
3. Set **`OPENROUTER_API_KEY`** (and `MOCK_ROAST=false`) as service env vars.  
4. Ship — Zerops gives you a live URL.

```yaml
# zerops.yaml (included)
zerops:
  - setup: roastroom
    build:
      base: nodejs@22
      buildCommands:
        - npm install
        - npm run build
      deployFiles: ./
    run:
      base: nodejs@22
      ports:
        - port: 3000
          httpSupport: true
      start: npm run start
```

## Zerops Challenge checklist

From [The Zerops Challenge](https://www.wemakedevs.org/hackathons/zerops) rules:

- [ ] Registered on WeMakeDevs  
- [ ] Deployed on **Zerops** with a **live URL**  
- [ ] `OPENROUTER_API_KEY` set; app stays up through judging  
- [ ] Repo public (or shared with judges)  
- [ ] **Build post** tagging **@WeMakeDevs** and **@zeropsio**, including:
  - Project name + what it does  
  - Short demo video (pick an arena → submit → roast → stamp)  
  - Link to live deployment  
  - How Zerops is used (Node service, `zerops.yaml`, env, public URL)  
- [ ] Submit the form with repo, live URL, demo, and post  

**AI-use:** AI can help you build — disclose tools used; show you understand the architecture.

## How Zerops is used

| Piece | Role |
| --- | --- |
| Node.js service | Hosts the Next.js app (SSR + API) |
| `zerops.yaml` | Build, deploy files, start command, HTTP port |
| Env vars | Secrets (`OPENROUTER_API_KEY`) and `MOCK_ROAST` |
| Public URL | Reachable product for judges and demos |

## Demo script (for your video)

1. Headphones disclaimer → Continue  
2. Choose **Resume** or **Startup**  
3. Paste an example → **Enter The Ring**  
4. Watch POV cuts + roast lines  
5. Mic defense (or Skip)  
6. Show **REJECTED** / **APPROVED** stamp + score  

~60–90 seconds is enough.

## What’s next (not in this weekend MVP)

Custom jury builder, landing-page URL roast, LinkedIn/portfolio arenas, Battle Mode, and “Make It Win” pivots — same orchestration pattern, more arenas.

---
