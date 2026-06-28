<div align="center">

<img src="https://img.shields.io/badge/OmniPoll-v5-D96C4A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDNoMTh2MkgzVjN6bTAgNGgxMnYySDF2LTJ6bTAgNGgxOHYySDN2LTJ6bTAgNGgxMnYySDF2LTJ6Ii8+PC9zdmc+" alt="OmniPoll v5"/>

# 🎓 OmniPoll

### Real-Time Interactive Polling & Quiz Platform for Education

[![HOST Portal](https://img.shields.io/badge/🎓%20Teacher%20Portal-omnipoll--host.vercel.app-D96C4A?style=flat-square)](https://omnipoll-host.vercel.app)
[![LEARN Portal](https://img.shields.io/badge/📚%20Student%20Portal-omnipoll--learn.vercel.app-7A8C6E?style=flat-square)](https://omnipoll-learn.vercel.app)

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
| 🎓 **HOST** — Teacher Dashboard | [omnipoll-host.vercel.app](https://omnipoll-host.vercel.app) | Create, launch & manage polls and quizzes |
| 📚 **LEARN** — Student Portal | [omnipoll-learn.vercel.app](https://omnipoll-learn.vercel.app) | Join polls, take quizzes, view results |

Both apps share one PostgreSQL database and real-time Pusher channels.

---

## ✨ What is OmniPoll?

OmniPoll is a **production-ready, full-stack educational polling platform** built as a **Vite + React + TypeScript monorepo** with two separate Vercel deployments.

- **Teachers** create and launch polls and quizzes from the HOST portal — choosing from 20 poll types, building multi-question quizzes with per-question timers and point values, and releasing results with full answer key sheets.
- **Students** join instantly from the LEARN portal using a 6-character code or QR code — no app install required. They can take timed quizzes, review their answer key sheets, and track their progress over time.

---

## 🚀 Feature Overview

### 🎓 HOST Portal (Teacher)

| Feature | Details |
|---------|---------| 
| **20 Poll Types** | MCQ, Quiz, True/False, Fill in Blank, Matching, Image Choice, Word Cloud, Q&A, Open Ended, Emoji, NPS, Star Rating, Slider, Ranking, Matrix Grid, 100-Point Priority, Heatmap Click, Bracket Vote, Countdown Timer, Poll Series |
| **Multi-Question Builder** | Per-question type, timer, points, shuffle, and explanation — all independent per question |
| **Multi-Answer Support** | Toggle "Multi-Answer" per question to allow multiple correct answers with checkbox-style selection |
| **Quiz Type Creator** | True/False auto-locked UI · MCQ with single or multi-answer marking · Fill in Blank · Matching pairs · Image choice |
| **Anti-Cheat Suite** | Tab-switch detection + auto-submit · Shuffle questions/options · Force fullscreen with ESC re-entry prompt · Negative marking |
| **Live Results** | Real-time bar chart · Option stats · Participant list with scores |
| **Results Release** | One-click release → students get Pusher notification + in-app alert · Key Sheet unlocked instantly |
| **Email Results** | Send per-student result email via Resend API · Branded HTML with score, grade, and deep link to key sheet |
| **Fullscreen Presenter** | Distraction-free present view with QR code for joining |
| **Classrooms** | Create rooms with invite code · Assign polls · Track results per class |
| **Deep Analytics** | Score distribution · Pass rate · Per-question stats · Leaderboard |
| **Moderation Panel** | Live tab-switch alert feed · Severity badges · Resolve & email student |
| **Templates** | Save any poll as template · Instant re-use |
| **Contact Page** | Sends real email via Resend API |
| **Student Portal Link** | Direct link to LEARN portal from HOST homepage |

### 📚 LEARN Portal (Student)

| Feature | Details |
|---------|---------| 
| **Join by Code** | 6-char code entry → instantly joins poll |
| **Guest Mode** | Join without account — just enter name |
| **Interactive Quiz** | Multi-question navigation · per-question timer · progress bar |
| **Multi-Answer Questions** | Checkbox-style UI when teacher enables multiple correct answers |
| **Fullscreen Mode** | Enters device fullscreen when teacher enables it; ESC shows re-entry overlay (quiz paused, progress saved) |
| **Tab Detection** | Warns student on tab switch · reports to teacher in real time |
| **Key Sheet** | Detailed per-question answer breakdown after results released |
| **My Results** | Full history of all attempts with scores + pass/fail; direct link to key sheet |
| **Post-Quiz Navigation** | After submission: links to Key Sheet, My Results dashboard, or Join Another Poll |
| **Classrooms** | Join teacher classrooms · see assigned polls |
| **Personal Analytics** | Score trend over time · distribution · performance by type |
| **Email Results** | "Email me this result" from Key Sheet — sends branded HTML email via Resend |
| **No Teacher Portal Link** | Clean student-only experience with no cross-portal navigation |

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
| **Pusher Channels** | Real-time push (votes, tab alerts, result release) |
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
users               — teacher & student accounts
polls               — all poll types + questions JSONB + settings JSONB
votes               — anonymous responses for non-quiz polls
attempts            — quiz attempts with detailed per-question answers JSONB
classrooms          — teacher-created rooms with invite codes
classroom_students  — many-to-many: students in classrooms
qa_items            — Q&A session questions with upvotes
notifications       — in-app notifications (result release, alerts)
templates           — saved poll templates per teacher
tab_alerts          — tab-switch cheating events with severity
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
git init && git add . && git commit -m "OmniPoll HOST"
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
STUDENT_APP_URL=https://omnipoll-learn.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=OmniPoll <noreply@yourdomain.com>
CONTACT_EMAIL=your@email.com
JWT_SECRET=your_random_secret_64chars
```

### 2 — Deploy LEARN Portal

```bash
cd learn
git init && git add . && git commit -m "OmniPoll LEARN"
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
STUDENT_APP_URL=https://omnipoll-learn.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=OmniPoll <noreply@yourdomain.com>
JWT_SECRET=your_random_secret_64chars  # same as HOST
```

> **Note:** The database auto-migrates on first cold start — no manual SQL needed.
>
> **Email tip:** During development, use `FROM_EMAIL=OmniPoll <onboarding@resend.dev>` — no domain verification required. For production, verify your domain in Resend and use your own address.

---

## 📁 Project Structure

```
omnipoll/
├── host/                          # 🎓 Teacher portal (HOST)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Create.tsx         # 20-type poll builder (multi-Q, multi-answer, per-type UX)
│   │   │   ├── Results.tsx        # Live results + release + email
│   │   │   ├── Present.tsx        # Fullscreen presenter + QR code
│   │   │   ├── Analytics.tsx      # Deep poll analytics
│   │   │   ├── Moderation.tsx     # Tab-switch alert panel
│   │   │   ├── Classrooms.tsx     # Classroom management
│   │   │   ├── Contact.tsx        # Contact form (Resend)
│   │   │   └── student/
│   │   │       └── KeySheet.tsx   # Per-attempt answer breakdown
│   │   ├── components/
│   │   │   └── DashboardLayout.tsx
│   │   └── lib/
│   │       ├── api.ts             # All API client methods
│   │       └── types.ts           # TypeScript interfaces
│   ├── api/
│   │   └── index.js               # Express serverless — 60+ endpoints
│   └── vercel.json
│
├── learn/                         # 📚 Student portal (LEARN)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── conduct/
│   │   │   │   ├── Join.tsx       # Code entry → poll join
│   │   │   │   ├── Participate.tsx # Quiz player (fullscreen ESC, multi-answer, tab detect)
│   │   │   │   └── PreQuiz.tsx    # Pre-quiz briefing screen
│   │   │   ├── student/
│   │   │   │   ├── KeySheet.tsx   # Answer sheet with per-Q breakdown
│   │   │   │   ├── StudentDashboard.tsx
│   │   │   │   └── StudentResults.tsx
│   │   │   ├── Analytics.tsx      # Personal score analytics
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

## 🔑 Environment Variables Reference

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
| `FROM_EMAIL` | Both | Verified sender address for Resend |
| `CONTACT_EMAIL` | HOST | Where contact form messages are delivered |
| `STUDENT_APP_URL` | HOST | LEARN portal URL (used in email links) |
| `VITE_STUDENT_APP_URL` | HOST (client) | LEARN portal URL (shown in HOST frontend) |
| `VITE_HOST_APP_URL` | LEARN (client) | HOST portal URL |

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key → add as `RESEND_API_KEY` in Vercel (both HOST and LEARN)
3. Verify your sending domain → set `FROM_EMAIL=OmniPoll <noreply@yourdomain.com>`
4. Set `CONTACT_EMAIL` (HOST only) to receive contact form submissions
5. Result emails are sent when a teacher clicks **Email Result** or a student clicks **Email me this result**

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
| POST | `/api/attempts/:id/submit` | Submit + auto-grade (multi-Q, multi-answer) |
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
--terracotta-500: #D96C4A   /* primary accent */
--cream-100:      #FEFAF5   /* background */
--slate-800:      #1E293B   /* text */
--sage-600:       #7A8C6E   /* secondary */
```

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss major changes.

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

<div align="center">

Built with ❤️ by [ShaikMuzzammil](https://github.com/ShaikMuzzammil)

**OmniPoll** — Full-stack · Real-time · Built for education

[🎓 Teacher Portal](https://omnipoll-host.vercel.app) &nbsp;·&nbsp; [📚 Student Portal](https://omnipoll-learn.vercel.app) &nbsp;·&nbsp; [GitHub](https://github.com/ShaikMuzzammil)

</div>
