# Office Housie (Next.js + Upstash Redis, Vercel ready)

One person hosts, everyone else joins with a 4 letter room code. Standard 3x9 tambola tickets,
8 prizes (Early Five, Four Corners, Top/Middle/Bottom Line, Queen's, King's, Full House),
server-side claim checking, number nicknames, voice calling.

## Run locally (no setup)
    npm install
    npm run dev          # http://localhost:3000, uses in-memory storage

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. Vercel > Add New > Project > import the repo > Deploy.
3. In the project: Storage (or Marketplace) > add **Upstash Redis** (free plan is enough) and connect it to the project.
   Vercel adds the env vars automatically (KV_REST_API_URL / KV_REST_API_TOKEN).
4. Redeploy once. Open your vercel.app link, host a game, share the link.

Using Vercel CLI instead: `npm i -g vercel`, `vercel`, add Upstash Redis from the dashboard, then `vercel --prod`.

## How it works
- Vercel is serverless, so game state lives in Redis, and browsers poll every 2 s.
  They only read one tiny version key until something changes (keeps Redis usage low).
- Numbers are drawn atomically (Redis INCR on a pre-shuffled sequence). First valid claim wins a prize (HSETNX).
- Rooms expire after 24 h. "Auto-call" runs from the host's browser tab, so keep it open.
