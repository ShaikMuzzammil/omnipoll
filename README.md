# OmniPoll v4 —  Monorepo

> **Two-app architecture** — Teacher host portal + Student learn portal sharing one Neon PostgreSQL database and Pusher Channels real-time layer.

```
omnipoll-v4/
├── host/          ← Teacher portal (create, present, moderate, analyse)
├── learn/         ← Student portal (join, take quizzes, view results)
└── README.md      ← This file
```

---

## 🏗️ Architecture

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│   OmniPoll HOST             │     │   OmniPoll LEARN            │
│   omnipoll-host.vercel.app  │     │   omnipoll-learn.vercel.app │
│                             │     │                             │
│  • Create polls & quizzes   │     │  • Join via code/QR         │
│  • 20 poll types wizard     │     │  • Pre-quiz guide screen    │
│  • Fullscreen presenter     │     │  • Tab-switch detection     │
│  • Live QR sharing          │     │  • Multi-question nav       │
│  • Moderation panel         │     │  • Submit & see score       │
│  • Tab-switch alerts        │     │  • Detailed key sheets      │
│  • Deep analytics           │     │  • Progress tracking        │
│  • Classroom management     │     │  • Leaderboard              │
│  • Results release          │     │  • My classrooms            │
└──────────┬──────────────────┘     └──────────┬──────────────────┘
           │                                   │
           └─────────────┬─────────────────────┘
                         │  Shared Infrastructure
                  ┌──────┴──────────────────────┐
                  │  Neon PostgreSQL             │
                  │  Pusher Channels (real-time) │
                  │  JWT Auth (same secret)      │
                  │  Express Serverless API      │
                  └─────────────────────────────┘
```

---

## 🚀 Deploy Both Apps to Vercel

### Step 1 — Set up shared infrastructure once

**Neon DB:** neon.tech → Create project → Copy connection string

**Pusher:** pusher.com → Create Channels app (cluster: ap2) → Copy keys

**JWT Secret:** Run `openssl rand -base64 32`

**Run migration (one time):**
```bash
cd host
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```

---

### Step 2 — Deploy HOST (Teacher Portal)

```bash
cd host
git init
git add .
git commit -m "OmniPoll HOST v4"
git remote add origin https://github.com/ShaikMuzzammil/omnipoll-host.git
git push -u origin main
```

**Vercel → New Project → omnipoll-host → Add env vars:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | your 32+ char secret |
| `PUSHER_APP_ID` | from pusher.com |
| `PUSHER_KEY` | from pusher.com |
| `PUSHER_SECRET` | from pusher.com |
| `PUSHER_CLUSTER` | `ap2` |
| `VITE_PUSHER_KEY` | same as PUSHER_KEY |
| `VITE_PUSHER_CLUSTER` | `ap2` |
| `VITE_STUDENT_APP_URL` | `https://omnipoll-learn.vercel.app` |

**Vercel settings:**
- Framework: `Vite`
- Build: `npm run build`
- Output: `dist`
- Install: `npm install && cd api && npm install`

---

### Step 3 — Deploy LEARN (Student Portal)

```bash
cd ../learn
git init
git add .
git commit -m "OmniPoll LEARN v4"
git remote add origin https://github.com/ShaikMuzzammil/omnipoll-learn.git
git push -u origin main
```

**Vercel → New Project → omnipoll-learn → Add env vars:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | **SAME** as host |
| `JWT_SECRET` | **SAME** as host |
| `PUSHER_APP_ID` | **SAME** as host |
| `PUSHER_KEY` | **SAME** as host |
| `PUSHER_SECRET` | **SAME** as host |
| `PUSHER_CLUSTER` | `ap2` |
| `VITE_PUSHER_KEY` | same as PUSHER_KEY |
| `VITE_PUSHER_CLUSTER` | `ap2` |
| `VITE_HOST_APP_URL` | `https://omnipoll-host.vercel.app` |

---

## 💻 Local Development

```bash
# Terminal 1 — HOST API
cd host
cp .env.example .env    # fill in your values
npm run dev:api         # API on :3001

# Terminal 2 — HOST Frontend
cd host
npm run dev             # App on :8080

# Terminal 3 — LEARN API
cd learn
cp .env.example .env    # fill in your values (same values as host)
npm run dev:api         # API on :3002 (or change PORT=3002 in .env)

# Terminal 4 — LEARN Frontend
cd learn
npm run dev             # App on :8081 (change port in vite.config.ts)
```

---

## 🎓 Demo Accounts

| Role | Email | Password | Portal |
|---|---|---|---|
| Teacher | `demo@omnipoll.io` | `demo1234` | HOST |
| Student | `student@omnipoll.io` | `student123` | LEARN |

---

## 📊 Feature Matrix

| Feature | HOST | LEARN |
|---|---|---|
| Landing page | Full with Demo widget | Student-focused |
| Login / Signup | Teacher role | Student role |
| Dashboard | Full poll management | My results & progress |
| Create poll | ✅ 20 types, multi-question | ❌ |
| Present fullscreen | ✅ QR + live chart | ❌ |
| Moderation | ✅ Tab alerts, live feed | ❌ |
| Analytics | ✅ Deep dive | ❌ |
| Templates | ✅ | ❌ |
| Join poll | ✅ (test as student) | ✅ Guest OK |
| Pre-quiz screen | ❌ | ✅ Warnings + guide |
| Participate | ✅ (test mode) | ✅ Full experience |
| Tab detection | Receive alerts | Sends alerts |
| Key sheets | ✅ Release to students | ✅ View own |
| Classrooms | ✅ Create + manage | ✅ Join + view |
| Leaderboard | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Settings | ✅ | ✅ |

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3 + Framer Motion |
| State | TanStack Query v5 + React Router v6 |
| Charts | Recharts |
| Real-time | Pusher Channels |
| Backend | Express.js (Vercel serverless) |
| Database | Neon PostgreSQL (auto-migrates on cold start) |
| Auth | JWT + bcryptjs (shared across both apps) |
| Deploy | Vercel (free tier, 2 projects) |

---

## 🔗 Live URLs (after deployment)

- **HOST (Teacher):** https://omnipoll-host.vercel.app
- **LEARN (Student):** https://omnipoll-learn.vercel.app
- **Join a poll:** https://omnipoll-learn.vercel.app/join

---

## 🔧 Fix: "relation users does not exist"

Both apps auto-create database tables on first API call (`ensureTables()`).  
If you see this error, it means `DATABASE_URL` is missing in Vercel env vars.  
→ Add it in **Vercel → Settings → Environment Variables → Redeploy**

---

Built with ❤️ — OmniPoll v4 GODMODE
