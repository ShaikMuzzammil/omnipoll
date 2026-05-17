# OmniPoll

OmniPoll is a live polling app for creators and participants. This repo uses the existing Vite React frontend plus a Node/Express + Socket.IO service for accounts, poll storage, voting, live results, and exports.

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:8080`  
API and Socket.IO: `http://localhost:8787`

`npm run dev` starts both the Vite frontend and the local Node/Express API. If you need to run them separately, use `npm run dev:client` and `npm run dev:api`.

## Environment

Create or update `.env`:

```bash
VITE_API_URL=http://localhost:8787
```

## What Is Implemented

- Email/name + password sign up and sign in only. GitHub/Google login has been removed.
- Persistent users and polls stored in `server/data/omnipoll.json`.
- Multiple Choice, Word Cloud, Q&A Session, Live Quiz, and Rating Scale.
- Join by code or participant URL.
- Socket.IO live updates for votes, word cloud, Q&A, leaderboard, and status changes.
- Creator dashboard with live counts, pause/resume/close controls, CSV export, printable PDF report, and iframe snippet.
- Basic rate limiting and one-vote-per-device protection.
- Local AI-style sentiment and theme clustering for Word Cloud and Q&A.

## Deployment Notes

Vercel static hosting can serve the Vite frontend, but Vercel serverless functions do not keep long-lived Socket.IO WebSocket servers alive reliably. For production, deploy `server/index.mjs` to a persistent Node host such as Render, Railway, Fly.io, or a VPS, then set:

```bash
VITE_API_URL=https://your-omnipoll-api.example.com
CLIENT_ORIGIN=https://your-vercel-site.vercel.app
```

For a database-backed production version, replace the file store in `server/index.mjs` with PostgreSQL/Prisma while keeping the same REST routes and Socket.IO events.
