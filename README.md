# OmniPoll v5 — GODMODE 🎓

> **Two-app monorepo educational polling platform.**
> HOST (teacher portal) · LEARN (student portal) · Shared Neon PostgreSQL + Pusher

---

## What's Fixed & Added in v5

| Area | Change |
|---|---|
| **Quiz Builder** | ALL 20 poll types support multiple questions. Per-question type selector. Options work for every type. `questions[]` stored in DB. |
| **Tab Detection** | `POST /api/polls/:id/tab-switch` fires on every tab change → real-time Pusher event to teacher + notification in DB. |
| **Moderation** | Live alert feed with severity badges (low/medium/🚨high), resolve button, email student, unresolved count badge in sidebar. |
| **Student Portal** | Removed all teacher references from Login. Clean student-only sidebar. StudentDashboard with quick join + classroom cards + recent results. |
| **ClassroomDetail HOST** | 3 tabs: Students (roster + email + remove), Polls (launch/stop/results), Results (per-attempt score + key sheet). |
| **ClassroomDetail LEARN** | Live polls first, upcoming/completed polls, My Results tab with score bars. |
| **Classrooms HOST** | Full create with name/subject/description, invite code display, delete, animated grid. |
| **API** | `questions` JSONB column added. `ALTER TABLE … ADD COLUMN IF NOT EXISTS` auto-migrates existing DBs. |

---

## Architecture

```
omnipoll-v5/
├── host/      ← Teacher portal (omnipoll-host.vercel.app)
│   ├── src/
│   ├── api/index.js   ← 50+ endpoints
│   └── vercel.json
├── learn/     ← Student portal (omnipoll-learn.vercel.app)
│   ├── src/
│   ├── api/index.js   ← Same API, same DB
│   └── vercel.json
└── README.md
```

---

## Deploy (Two Vercel Projects, One Database)

### Step 1 — Run DB migration once

```bash
cd host
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```

### Step 2 — Deploy HOST

```bash
cd host
git init && git add . && git commit -m "OmniPoll v5 HOST"
git remote add origin https://github.com/ShaikMuzzammil/omnipoll-host.git
git push -u origin main
```

Vercel → New Project → omnipoll-host → **9 env vars** → Deploy

### Step 3 — Deploy LEARN

```bash
cd ../learn
git init && git add . && git commit -m "OmniPoll v5 LEARN"
git remote add origin https://github.com/ShaikMuzzammil/omnipoll-learn.git
git push -u origin main
```

Vercel → New Project → omnipoll-learn → **Same env vars + VITE_HOST_APP_URL** → Deploy

---

## Environment Variables

### HOST app

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Any 32+ char random string |
| `PUSHER_APP_ID` | From pusher.com → App Keys |
| `PUSHER_KEY` | From pusher.com → App Keys |
| `PUSHER_SECRET` | From pusher.com → App Keys |
| `PUSHER_CLUSTER` | `ap2` |
| `VITE_PUSHER_KEY` | Same as `PUSHER_KEY` |
| `VITE_PUSHER_CLUSTER` | `ap2` |
| `VITE_STUDENT_APP_URL` | `https://omnipoll-learn.vercel.app` |
| `RESEND_API_KEY` | From resend.com (for email results) |
| `EMAIL_FROM` | `noreply@yourdomain.com` |

### LEARN app

All same vars **except**:
- Remove `VITE_STUDENT_APP_URL`
- Add `VITE_HOST_APP_URL=https://omnipoll-host.vercel.app`

---

## Features

### HOST (Teacher)
- Dashboard with live poll stats + activity feed
- **Quiz Builder**: 20 poll types, unlimited questions per quiz, per-question type selector, options/matching/matrix/slider per question, correct answer marking, points, explanation
- Present mode with QR code (links to LEARN app)
- Results: participant table, expandable cards, email individual/all
- Moderation: real-time tab switch alerts, severity levels, resolve, email
- Classrooms: create with invite code, manage roster, assign polls, class results
- Analytics: overview charts, score distribution, top polls

### LEARN (Student)
- Clean student-only interface (no teacher login)
- Quick join via code or QR scan
- Pre-quiz screen with rules and warnings
- 20 question type renderers with timer ring
- Tab detection → auto-submit on 3rd switch
- Classrooms: join by code, view live/upcoming/completed polls, scores
- Key sheet: per-answer breakdown with correct/wrong overlay
- Leaderboard, Notifications, Results history

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS (cream/terracotta design system) |
| Animation | Framer Motion |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Auth | JWT + bcryptjs |
| Database | Neon PostgreSQL (serverless) |
| Real-time | Pusher Channels (cluster ap2) |
| Email | Resend API |
| Deploy | Vercel (SPA + serverless API) |
