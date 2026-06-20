# OmniPoll HOST — Teacher Portal

> The teacher-facing application for OmniPoll v4. Create polls, conduct quizzes, monitor tab switches, view deep analytics, and manage classrooms.

**Live:** https://omnipoll-host.vercel.app  
**Partner App (Student):** https://omnipoll-learn.vercel.app

---

## Features

- **20 Poll Types** — Multiple choice, quiz, word cloud, Q&A, NPS, rating, slider, ranking, matrix, priority, heatmap, emoji, bracket, fill-blank, matching, true/false, image choice, countdown, series, open-ended
- **Multi-question Quiz Builder** — Add unlimited questions, set per-question timers and points, shuffle options
- **Fullscreen Presenter** — Live bar charts, word cloud, leaderboard, QR code for instant joining
- **Moderation Panel** — Real-time tab-switch alerts with student name, email, classroom, severity
- **Classroom Management** — Create groups, invite students, view per-student results
- **Deep Analytics** — Score distributions, item analysis, top scorers, hourly activity
- **Result Release** — One-click release to students with email notification
- **Key Sheets** — Per-student detailed answer breakdown with explanations

---

## Deploy to Vercel

### Environment Variables (add in Vercel → Settings → Environment Variables)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 32+ char random string (same as LEARN) |
| `PUSHER_APP_ID` | ✅ | From pusher.com App Keys |
| `PUSHER_KEY` | ✅ | From pusher.com App Keys |
| `PUSHER_SECRET` | ✅ | From pusher.com App Keys |
| `PUSHER_CLUSTER` | ✅ | `ap2` (Mumbai) |
| `VITE_PUSHER_KEY` | ✅ | Same as PUSHER_KEY |
| `VITE_PUSHER_CLUSTER` | ✅ | `ap2` |
| `VITE_STUDENT_APP_URL` | ✅ | `https://omnipoll-learn.vercel.app` |
| `RESEND_API_KEY` | ⬜ | Optional — for email notifications |

### Vercel Build Settings

| Setting | Value |
|---|---|
| Framework | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install && cd api && npm install` |
| Root Directory | *(blank)* |

### One-time DB setup

```bash
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```

Creates all tables + demo accounts:
- Teacher: `demo@omnipoll.io` / `demo1234`
- Student: `student@omnipoll.io` / `student123`

---

## Local Development

```bash
cp .env.example .env    # fill in your DATABASE_URL, JWT_SECRET, PUSHER_*
npm install
npm run dev:api          # API server on :3001
npm run dev              # Frontend on :8080 (in a second terminal)
```

---

## Tech Stack

Vite 5 · React 18 · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Recharts · Pusher Channels · Express (serverless) · Neon PostgreSQL · JWT + bcryptjs
