<div align="center">

<img src="https://img.shields.io/badge/OmniPoll-v5%20GODMODE-D96C4A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDNoMTh2MkgzVjN6bTAgNGgxMnYySDF2LTJ6bTAgNGgxOHYySDN2LTJ6bTAgNGgxMnYySDF2LTJ6Ii8+PC9zdmc+" alt="OmniPoll v5 GODMODE"/>

# 🎓 OmniPoll v5 GODMODE

### The Complete Interactive Polling & Quiz Platform for Education

[![HOST Portal](https://img.shields.io/badge/🎓%20HOST%20Portal-omnipoll--host.vercel.app-D96C4A?style=flat-square)](https://omnipoll-host.vercel.app)
[![LEARN Portal](https://img.shields.io/badge/📚%20LEARN%20Portal-omnipoll--learn.vercel.app-7A8C6E?style=flat-square)](https://omnipoll-learn.vercel.app)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E5A0?style=flat-square&logo=postgresql)](https://neon.tech)
[![Pusher](https://img.shields.io/badge/Pusher-Realtime-300D4F?style=flat-square&logo=pusher)](https://pusher.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## 🌐 Live Applications

| Portal | URL | Role |
|--------|-----|------|
| 🎓 **HOST** — Teacher Dashboard | [omnipoll-host.vercel.app](https://omnipoll-host.vercel.app) | Create, launch, manage polls & quizzes |
| 📚 **LEARN** — Student Portal | [omnipoll-learn.vercel.app](https://omnipoll-learn.vercel.app) | Join polls, take quizzes, view results |

Both apps share one PostgreSQL database and real-time Pusher channels.

---

## ✨ What is OmniPoll?

OmniPoll is a **production-ready, full-stack educational polling platform** built as a **Vite + React + TypeScript monorepo** with two separate Vercel deployments. Teachers create and launch polls and quizzes; students join instantly with a short code — no app install required.

---

## 🚀 Feature Overview

### 🎓 HOST Portal (Teacher)
| Feature | Details |
|---------|---------|
| **20 Poll Types** | MCQ, Quiz, True/False, Fill in Blank, Matching, Image Choice, Word Cloud, Q&A, Open Ended, Emoji, NPS, Star Rating, Slider, Ranking, Matrix Grid, 100-Point Priority, Heatmap Click, Bracket Vote, Countdown Timer, Poll Series |
| **Multi-Question Builder** | Per-question type, timer, points, shuffle, explanation — all independent per question |
| **Quiz Type Creator** | True/False auto-locked binary choice · MCQ A/B/C/D with correct answer marking · Fill in Blank with ___ notation · Matching pairs editor · Image choice with URL fields |
| **Anti-Cheat Suite** | Tab-switch detection + auto-submit · Shuffle questions/options · Force fullscreen · Negative marking with configurable penalty |
| **Live Results** | Real-time bar chart · Option stats · Participant list with scores |
| **Results Release** | One-click release → students get Pusher notification + in-app notification · Key Sheet unlocked |
| **Email Results** | Send per-student or bulk email with Resend API · Branded HTML template with score + deep link |
| **Fullscreen Presenter** | Distraction-free present view with QR code for joining |
| **Classrooms** | Create rooms with invite code · Assign polls · Track results per class |
| **Deep Analytics** | Score distribution · Pass rate · Per-question stats · Leaderboard |
| **Moderation Panel** | Live tab-switch alert feed · Severity badges · Resolve & email student |
| **Templates** | Save any poll as template · Instant re-use |
| **Contact Page** | Sends real email via Resend API |

### 📚 LEARN Portal (Student)
| Feature | Details |
|---------|---------|
| **Join by Code** | 6-char code entry → instantly joins poll |
| **Guest Mode** | Join without account — just enter name |
| **Interactive Quiz** | Multi-question navigation · per-question timer · progress bar |
| **Fullscreen Mode** | Enters device fullscreen when teacher enables it |
| **Tab Detection** | Warns student on tab switch · reports to teacher |
| **Key Sheet** | Detailed per-question answer breakdown after results released |
| **My Results** | Full history of all attempts with scores + pass/fail |
| **Classrooms** | Join teacher classrooms · see assigned polls |
| **Personal Analytics** | Score trend over time · distribution · performance by type |
| **Email Results** | "Email me this result" one-tap from Key Sheet |

---

## 🛠 Tech Stack

### Frontend (Both Portals)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18 | UI framework |
| **TypeScript** | 5 | Type safety |
| **Vite** | 5 | Build tool & dev server |
| **React Router** | 6 | Client-side routing |
| **TanStack Query** | 5 | Server state, caching, polling |
| **Framer Motion** | 11 | Animations & transitions |
| **Tailwind CSS** | 3 | Utility-first styling |
| **shadcn/ui** | latest | Accessible component primitives |
| **Recharts** | 2 | Bar, line & distribution charts |
| **Pusher JS** | 8 | Real-time WebSocket client |
| **Sonner** | latest | Toast notifications |
| **Lucide React** | latest | Icon set |

### Backend (Shared API)
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Serverless API (Vercel Functions) |
| **PostgreSQL (Neon)** | Persistent data store — serverless, auto-scales |
| **Pusher Channels** | Real-time push (new votes, tab alerts, result release) |
| **Resend API** | Transactional email — results, contact form |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | Auth tokens (JWT) |
| **node-postgres (pg)** | DB driver with connection pooling |

### Infrastructure
| Service | Role |
|---------|------|
| **Vercel** | Two separate deployments (HOST + LEARN) |
| **Neon PostgreSQL** | Shared serverless database |
| **Pusher** | Real-time event bus |
| **Resend** | Email delivery |

---

## 🗄 Database Schema (10 Tables)

```
users            — teacher & student accounts
polls            — all poll types + questions JSONB + settings JSONB
votes            — anonymous responses for non-quiz polls
attempts         — quiz attempts with detailed per-question answers JSONB
classrooms       — teacher-created rooms with invite codes
classroom_students — many-to-many: students in classrooms
qa_items         — Q&A session questions with upvotes
notifications    — in-app notifications (result release, alerts)
templates        — saved poll templates per teacher
tab_alerts       — tab-switch cheating events with severity
```

---

## ⚡ Quick Deploy

### Prerequisites
- [Neon](https://neon.tech) PostgreSQL database URL
- [Pusher](https://pusher.com) app (cluster `ap2` or your region)
- [Resend](https://resend.dev) API key (for email features)
- [Vercel](https://vercel.com) account

### 1 — Deploy HOST Portal

```bash
cd host
git init && git add . && git commit -m "OmniPoll HOST v5"
# Push to GitHub, then import in Vercel
```

**Vercel Environment Variables (HOST):**
```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap2
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=ap2
VITE_STUDENT_APP_URL=https://omnipoll-learn.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=OmniPoll <noreply@yourdomain.com>
CONTACT_EMAIL=your@email.com
JWT_SECRET=your_random_secret_64chars
```

### 2 — Deploy LEARN Portal

```bash
cd learn
git init && git add . && git commit -m "OmniPoll LEARN v5"
# Push to GitHub, import as separate Vercel project
```

**Vercel Environment Variables (LEARN):**
```env
DATABASE_URL=postgresql://...          # same DB as HOST
PUSHER_APP_ID=your_pusher_app_id       # same Pusher app
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=ap2
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=ap2
VITE_HOST_APP_URL=https://omnipoll-host.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=OmniPoll <noreply@yourdomain.com>
JWT_SECRET=your_random_secret_64chars  # same as HOST
```

> **Note:** The database auto-migrates on first cold start — no manual SQL needed.

---

## 📁 Monorepo Structure

```
omnipoll-v5/
├── host/                          # Teacher portal (HOST)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Create.tsx         # 20-type poll builder (multi-Q, per-type UX)
│   │   │   ├── Results.tsx        # Live results + release + email
│   │   │   ├── Present.tsx        # Fullscreen presenter + QR code
│   │   │   ├── Analytics.tsx      # Deep poll analytics
│   │   │   ├── Moderation.tsx     # Tab-switch alert panel
│   │   │   ├── Classrooms.tsx     # Classroom management
│   │   │   ├── Contact.tsx        # Contact form (Resend)
│   │   │   └── student/
│   │   │       └── KeySheet.tsx   # Per-attempt answer breakdown
│   │   ├── components/
│   │   │   └── DashboardLayout.tsx # Sidebar with quiz quick-create nav
│   │   └── lib/
│   │       ├── api.ts             # All API client methods
│   │       └── types.ts           # TypeScript interfaces
│   ├── api/
│   │   └── index.js               # Express serverless — 60+ endpoints
│   └── vercel.json
│
├── learn/                         # Student portal (LEARN)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── conduct/
│   │   │   │   ├── Join.tsx       # Code entry → poll join
│   │   │   │   ├── Participate.tsx # Quiz player (fullscreen, tab detect)
│   │   │   │   └── PreQuiz.tsx    # Pre-quiz briefing screen
│   │   │   ├── student/
│   │   │   │   ├── KeySheet.tsx   # Answer sheet with per-Q breakdown
│   │   │   │   ├── StudentDashboard.tsx
│   │   │   │   └── StudentResults.tsx
│   │   │   ├── Analytics.tsx      # Personal score analytics
│   │   │   ├── ClassroomDetail.tsx
│   │   │   └── Contact.tsx        # Contact form
│   │   └── lib/
│   │       └── types.ts
│   ├── api/
│   │   └── index.js               # Same API (synced from host)
│   └── vercel.json
│
└── README.md
```

---

## 🔧 v5 Bug Fixes (This Release)

| # | Bug | Fix |
|---|-----|-----|
| 1 | **`o.toFixed is not a function`** crash on KeySheet & Results | PostgreSQL NUMERIC returns strings — wrapped all `.toFixed()` with `Number()` + API returns proper numbers |
| 2 | **Multi-question quiz grading wrong** | Submit endpoint now grades all questions using `allAnswers[qi]` + `questions[]` JSONB |
| 3 | **KeySheet shows wrong answers** | Keysheet now reads `answers[]` in detailed format; falls back to questions JSONB for older attempts |
| 4 | **Release Results button silent fail** | Added `onError` handler with toast; button now shows on `paused` status too |
| 5 | **Clipboard copy broken on HTTP** | `copyToClipboard()` util with `execCommand` fallback for all browsers |
| 6 | **Email → login redirect** | Email endpoint accepts optional auth; proper JSON `Content-Type`; graceful error toasts |
| 7 | **Resend key not configured** | Returns `200` with info message (not error) if key missing; logs submission server-side |
| 8 | **Contact form does nothing** | Calls `POST /api/contact` → logs + sends via Resend if configured |
| 9 | **True/False same as MCQ** | Locked 2-option T/F UI; correct-answer click toggles between True/False |
| 10 | **Sidebar quiz type links** | `?type=X` URL param auto-advances to Step 1; skips type-picker step |
| 11 | **Fullscreen setting ignored** | `Participate.tsx` calls `requestFullscreen()` when `poll.settings.fullscreenMode` is true |
| 12 | **`toFixed` in all LEARN pages** | Fixed in Analytics, StudentDashboard, StudentResults, ClassroomDetail, AnalyseDetail |

---

## 🔑 Key Env Variables Reference

| Variable | Where | What |
|----------|-------|------|
| `DATABASE_URL` | Both | Neon PostgreSQL connection string |
| `PUSHER_APP_ID` | Both (server) | Pusher app ID |
| `PUSHER_KEY` | Both (server) | Pusher key |
| `PUSHER_SECRET` | Both (server) | Pusher secret |
| `PUSHER_CLUSTER` | Both (server) | e.g. `ap2` |
| `VITE_PUSHER_KEY` | Both (client) | Same Pusher key (exposed to browser) |
| `VITE_PUSHER_CLUSTER` | Both (client) | Same cluster |
| `JWT_SECRET` | Both | Random 64-char secret for JWT signing |
| `RESEND_API_KEY` | Both | `re_xxxxx` from resend.com |
| `FROM_EMAIL` | Both | Sender address (domain must be verified in Resend) |
| `CONTACT_EMAIL` | Both | Where contact form messages go |
| `VITE_STUDENT_APP_URL` | HOST | LEARN portal URL |
| `VITE_HOST_APP_URL` | LEARN | HOST portal URL |

> 💡 **Email tip:** Use `OmniPoll <onboarding@resend.dev>` as `FROM_EMAIL` during development — no domain verification needed.

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key → add as `RESEND_API_KEY` in Vercel
3. Verify your domain → set `FROM_EMAIL=YourName <you@yourdomain.com>`
4. Set `CONTACT_EMAIL` to receive contact form submissions
5. Student emails arrive when teacher clicks **Email Result** or **Email All**

---

## 🧪 Local Development

```bash
# HOST
cd host
npm install
cp .env.example .env.local    # fill in your keys
npm run dev                   # http://localhost:5173

# LEARN
cd learn
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:5174

# API runs via Vite proxy → vercel dev or direct node
cd host/api && node -e "require('./index').listen(3001)"
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Clients                       │
│         HOST Portal              LEARN Portal            │
│    (Teacher Dashboard)         (Student App)             │
│   React + TypeScript          React + TypeScript         │
│   Vite + TanStack Query       Vite + TanStack Query      │
│   Pusher JS (real-time)       Pusher JS (real-time)      │
└─────────┬──────────────────────────────┬────────────────┘
          │ HTTPS + Vercel Rewrites       │
┌─────────▼──────────────────────────────▼────────────────┐
│              Shared Express API (Vercel Serverless)       │
│   /api/auth  /api/polls  /api/attempts  /api/classrooms  │
│   /api/contact  /api/notifications  /api/tab-alerts      │
└─────────┬──────────────────────┬───────────┬────────────┘
          │                      │           │
  ┌───────▼──────┐  ┌────────────▼──┐  ┌───▼───────────┐
  │ Neon         │  │ Pusher         │  │ Resend         │
  │ PostgreSQL   │  │ Channels       │  │ Email API      │
  │ (10 tables)  │  │ (real-time)    │  │ (results mail) │
  └──────────────┘  └───────────────┘  └───────────────┘
```

---

## 📊 API Reference (60+ Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register teacher or student |
| POST | `/api/auth/signin` | Login → JWT token |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/polls` | List teacher's polls |
| POST | `/api/polls` | Create poll (all 20 types) |
| GET | `/api/polls/:id` | Get poll with questions |
| PUT | `/api/polls/:id` | Update poll |
| PATCH | `/api/polls/:id/status` | Launch / close / pause |
| POST | `/api/polls/:id/release` | Release results → notify students |
| GET | `/api/polls/:id/results` | Live option stats |
| GET | `/api/polls/:id/analytics` | Full analytics breakdown |
| POST | `/api/polls/:id/attempts/start` | Start quiz attempt |
| PATCH | `/api/attempts/:id/save` | Auto-save draft answers |
| POST | `/api/attempts/:id/submit` | Submit + auto-grade (multi-Q) |
| GET | `/api/attempts/:id/keysheet` | Full answer breakdown |
| POST | `/api/attempts/:id/email-result` | Send result email via Resend |
| GET | `/api/classrooms` | List classrooms |
| POST | `/api/classrooms` | Create classroom |
| POST | `/api/classrooms/join` | Student joins by invite code |
| POST | `/api/polls/:id/tab-switch` | Record tab switch alert |
| GET | `/api/polls/:id/tab-alerts` | Teacher sees alerts |
| POST | `/api/contact` | Contact form → Resend email |

---

## 🎨 Design System

OmniPoll uses a warm **terracotta & sage** palette with Inter/Sora fonts:

```css
--terracotta-500: #D96C4A   /* primary */
--cream-100:      #FEFAF5   /* background */
--slate-800:      #1E293B   /* text */
--sage-600:       #7A8C6E   /* secondary */
```

Components follow a clean card-based layout with smooth Framer Motion transitions and accessible keyboard navigation throughout.

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss major changes.

```bash
git checkout -b feature/my-feature
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

<div align="center">

Built with ❤️ by [ShaikMuzzammil](https://github.com/ShaikMuzzammil)

**OmniPoll v5 GODMODE** — Full-stack · Real-time · Zero compromise

[🎓 HOST Portal](https://omnipoll-host.vercel.app) · [📚 LEARN Portal](https://omnipoll-learn.vercel.app) · [GitHub](https://github.com/ShaikMuzzammil)

</div>
