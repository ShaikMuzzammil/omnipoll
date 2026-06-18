# OmniPoll v3 — GODMODE Edition

> The most powerful live polling & quiz platform — 20 poll types, real-time results, classroom management, key sheets, deep analytics. Vite + React + Neon PostgreSQL + Pusher. One-click Vercel deploy.

---

## 🚨 Fix: ECONNREFUSED Error (Most Common Issue)

The error `connect ECONNREFUSED 127.0.0.1:5432` means **DATABASE_URL is not set in Vercel**.

### Step-by-step fix:

1. Go to **vercel.com → your project → Settings → Environment Variables**
2. Add ALL of these (copy-paste exact names):

| Variable Name | Value | How to get |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host.neon.tech/neondb?sslmode=require` | neon.tech → your project → **Connection string** (copy the full URL) |
| `JWT_SECRET` | `any-random-string-32-chars-minimum` | Run: `openssl rand -base64 32` |
| `PUSHER_APP_ID` | `1234567` | pusher.com → your app → **App Keys** tab |
| `PUSHER_KEY` | `abc123def456` | pusher.com → App Keys |
| `PUSHER_SECRET` | `secret123` | pusher.com → App Keys |
| `PUSHER_CLUSTER` | `ap2` | pusher.com → App Keys (use `ap2` for India) |
| `VITE_PUSHER_KEY` | same as `PUSHER_KEY` | — |
| `VITE_PUSHER_CLUSTER` | `ap2` | — |

3. After adding all vars → **Deployments → Redeploy** (uncheck "use cache")

> ⚠️ The `DATABASE_URL` must be from Neon (neon.tech), NOT localhost.

---

## 🗄️ Neon PostgreSQL Setup (Free)

1. Go to **neon.tech** → Sign up free → Create a project
2. Click your project → **Connection Details** → copy **Connection string**
3. It looks like: `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Run the migration once:
```bash
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```
This creates all 8 tables and seeds demo accounts.

---

## 📡 Pusher Setup (Free)

1. Go to **pusher.com** → Sign up → Create a **Channels** app
2. Choose cluster: **ap2** (Mumbai, best for India)
3. Go to **App Keys** tab → copy App ID, Key, Secret, Cluster
4. Add all 4 to Vercel env vars (see table above)

---

## 🚀 Full Deploy in 6 Steps

```bash
# 1. Unzip and install
unzip omnipoll-v3-godmode.zip && cd omnipoll && npm install

# 2. Run DB migration (paste your Neon URL)
DATABASE_URL="postgresql://user:pass@host.neon.tech/neondb?sslmode=require" node scripts/migrate.cjs

# 3. Push to GitHub
git init
git add .
git commit -m "OmniPoll v3 GODMODE"
git remote add origin https://github.com/ShaikMuzzammil/omnipoll.git
git push -u origin main

# 4. Go to vercel.com → New Project → Import from GitHub → select omnipoll

# 5. Add all 8 environment variables (table above)

# 6. Deploy → Done!
```

**Vercel settings** (should auto-detect, but verify):
- Framework: `Vite`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Install command: `npm install && cd api && npm install`
- Root directory: *(blank)*

---

## 💻 Local Development

**Terminal 1 — API:**
```bash
cp .env.example .env
# Edit .env: fill in DATABASE_URL, JWT_SECRET, PUSHER_*
npm run dev:api
# API running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# App running at http://localhost:8080
# Vite proxies /api/* → localhost:3001 automatically
```

---

## 🎓 Demo Accounts (seeded by migrate.cjs)

| Role | Email | Password |
|---|---|---|
| Teacher | `demo@omnipoll.io` | `demo1234` |
| Student | `student@omnipoll.io` | `student123` |

---

## 📊 20 Poll Types

| # | Type | Use Case |
|---|---|---|
| 1 | Multiple Choice | Single-select questions |
| 2 | Quiz | Scored quiz with timer & negative marking |
| 3 | Word Cloud | Free-text, visualised as live cloud |
| 4 | Q&A | Audience questions with upvoting |
| 5 | NPS Score | Net Promoter Score (0–10) |
| 6 | Star Rating | 1–5 star rating |
| 7 | Slider | Numeric range input |
| 8 | Ranking | Drag-and-drop ordering |
| 9 | Matrix Grid | Row × Column radio grid |
| 10 | 100-Point Priority | Allocate points across options |
| 11 | Heatmap Click | Click on an image/area |
| 12 | Emoji Reactions | Pick an emoji |
| 13 | Bracket Vote | Tournament-style elimination |
| 14 | Fill in the Blank | Text completion |
| 15 | Live Matching | Match pairs |
| 16 | True / False | Binary choice |
| 17 | Image Choice | Pick from images |
| 18 | Countdown Timer | Timed announcement |
| 19 | Poll Series | Multiple questions in sequence |
| 20 | Open Ended | Free-text response |

---

## 🗺️ All Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Sign in | Public |
| `/signup` | Create account (2-step) | Public |
| `/join/:code` | Join a poll by code | Public |
| `/participate/:pollId` | Take quiz/poll | Public (guest OK) |
| `/dashboard` | Teacher hub | Teacher |
| `/create` | 5-step poll wizard | Teacher |
| `/results/:pollId` | Live results + attempts | Teacher |
| `/present/:pollId` | Fullscreen presenter | Teacher |
| `/analytics` | Global analytics | Teacher |
| `/classrooms` | Classroom list | All |
| `/classrooms/:id` | Students, polls, results | Teacher |
| `/templates` | Template library | Teacher |
| `/leaderboard` | Top scorers | All |
| `/notifications` | Notification center | All |
| `/settings` | Profile & security | All |
| `/student/dashboard` | Student home | Student |
| `/student/results` | All my attempts | Student |
| `/attempt/:id/keysheet` | Detailed answer sheet | Student |
| `/analyse/:pollId` | Deep poll analytics | Teacher |

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3 + Framer Motion |
| State | TanStack Query v5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Real-time | Pusher Channels |
| Backend | Express.js (Vercel serverless function) |
| Database | Neon PostgreSQL (serverless) |
| Auth | JWT + bcryptjs |
| Deploy | Vercel (free tier) |

---

## 🔒 Security

- Passwords hashed with bcrypt (cost 10)
- JWT tokens expire in 30 days
- Key sheets only shown after `results_released`
- Pusher private channels for user notifications
- DATABASE_URL never exposed to frontend

---

Built with ❤️ in India — OmniPoll v3 GODMODE
