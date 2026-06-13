# OmniPoll v2 — Real-time Polling Platform

> Built with React + Vite, Neon PostgreSQL, and Pusher Channels. Deploys to Vercel in 3 minutes. Build verified ✅

---

## 20 Poll Types
Multiple Choice · Word Cloud · Q&A · Live Quiz · Rating · Ranking · Open Text · Image Choice · NPS · Matrix Grid · Slider · True/False · Fill Blank · Bracket · Prioritization · Heatmap · Emoji Reaction · Poll Series · Countdown Vote · Live Matching

---

## Deploy to Vercel

### 1. Neon Database (free at neon.tech)
```bash
npm install
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```

### 2. Pusher Channels (free at pusher.com)
Create app → Cluster: ap2 → copy app_id, key, secret

### 3. Vercel Settings
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Root Directory: (blank)

### Environment Variables
```
DATABASE_URL          = postgresql://...neon.tech/...?sslmode=require
JWT_SECRET            = any-32-char-random-string
PUSHER_APP_ID         = from Pusher App Keys
PUSHER_KEY            = from Pusher App Keys
PUSHER_SECRET         = from Pusher App Keys
PUSHER_CLUSTER        = ap2
VITE_PUSHER_KEY       = same as PUSHER_KEY
VITE_PUSHER_CLUSTER   = ap2
```

---

## Local Development
```bash
npm install
cp .env.example .env   # fill in values
node scripts/migrate.cjs
npm run dev            # http://localhost:8080
```

Demo: demo@omnipoll.io / demo1234

---

## Structure
```
api/index.js      Express serverless (CommonJS)
api/package.json  {"type":"commonjs"}
src/pages/        12 pages
src/components/   DashboardLayout + UI
src/hooks/        useAuth, usePusher
scripts/migrate.cjs  DB setup
vercel.json       SPA + API rewrites
```

## Troubleshooting
- Framework must be Vite (not Next.js) — output is dist/
- Both PUSHER_KEY and VITE_PUSHER_KEY must be set
- vercel.json must be committed for SPA routing to work
