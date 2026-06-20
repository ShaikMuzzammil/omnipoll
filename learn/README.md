# OmniPoll LEARN — Student Portal

> The student-facing application for OmniPoll v4. Join polls by code or QR, take quizzes with pre-quiz guide screen, view scores, and review detailed key sheets.

**Live:** https://omnipoll-learn.vercel.app  
**Partner App (Teacher):** https://omnipoll-host.vercel.app

---

## Features

- **Join by Code or QR** — 6-character code entry with instant poll lookup
- **Pre-Quiz Screen** — Warnings, settings summary, and guide before starting
- **Multi-question Navigation** — Question number bar, previous/next, save answers
- **Tab Switch Detection** — Alerts sent to teacher instantly (1-3 warnings before auto-submit)
- **All 20 Poll Types** — Full participation UI for every interaction type
- **Live Timer** — Per-question and global countdown with visual ring
- **My Results** — All attempts with scores, pass/fail, time taken
- **Key Sheets** — Detailed per-answer breakdown (released by teacher)
- **Classrooms** — View enrolled classes and class results
- **Leaderboard** — Rankings across all quizzes

---

## Deploy to Vercel

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | **Same** Neon DB as HOST app |
| `JWT_SECRET` | ✅ | **Same** secret as HOST app |
| `PUSHER_APP_ID` | ✅ | **Same** Pusher as HOST app |
| `PUSHER_KEY` | ✅ | **Same** Pusher as HOST app |
| `PUSHER_SECRET` | ✅ | **Same** Pusher as HOST app |
| `PUSHER_CLUSTER` | ✅ | `ap2` |
| `VITE_PUSHER_KEY` | ✅ | Same as PUSHER_KEY |
| `VITE_PUSHER_CLUSTER` | ✅ | `ap2` |
| `VITE_HOST_APP_URL` | ✅ | `https://omnipoll-host.vercel.app` |

### Vercel Build Settings

| Setting | Value |
|---|---|
| Framework | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install && cd api && npm install` |
| Root Directory | *(blank)* |

---

## Local Development

```bash
cp .env.example .env    # same values as HOST app
npm install
npm run dev:api          # API on :3001 (or set PORT=3002 to avoid conflict with HOST)
npm run dev              # Frontend on :8080 (change to 8081 in vite.config.ts)
```

---

## Student Flow

```
Land on / → Join with code → PreQuiz screen (warnings + guide)
→ Take quiz (timer + tab detection) → Submit
→ See score → View Key Sheet (when teacher releases)
→ My Dashboard (all attempts + progress)
```

## Tech Stack

Vite 5 · React 18 · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Pusher Channels · Express (serverless) · Neon PostgreSQL · JWT + bcryptjs
