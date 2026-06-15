# OmniPoll v3 — GODMODE Edition

> **The most powerful live polling & quiz platform** — 20 poll types, real-time results, classroom management, detailed key sheets, deep analytics. Built with Vite + React + Neon PostgreSQL + Pusher. Deploys to Vercel in minutes.

---

## 🏗️ Architecture

```
omnipoll/
├── src/                          # Vite + React frontend
│   ├── pages/
│   │   ├── Index.tsx             # Landing page
│   │   ├── Login.tsx / Signup.tsx
│   │   ├── Dashboard.tsx         # Teacher hub
│   │   ├── Create.tsx            # 5-step poll wizard (20 types)
│   │   ├── Results.tsx           # Live results + attempt list
│   │   ├── Present.tsx           # Fullscreen presenter view
│   │   ├── Analytics.tsx         # Global analytics
│   │   ├── Templates.tsx         # 10+ built-in templates
│   │   ├── Classrooms.tsx        # Classroom management
│   │   ├── ClassroomDetail.tsx   # Students, polls, results
│   │   ├── Leaderboard.tsx       # Top scorers
│   │   ├── Notifications.tsx     # Notification center
│   │   ├── Settings.tsx          # Profile, security
│   │   ├── conduct/
│   │   │   ├── Join.tsx          # 6-char code entry
│   │   │   └── Participate.tsx   # Student quiz experience
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentResults.tsx
│   │   │   └── KeySheet.tsx      # Per-attempt answer breakdown
│   │   └── analyse/
│   │       └── AnalyseDetail.tsx # Deep poll analytics
│   ├── components/
│   │   ├── DashboardLayout.tsx   # Sidebar + topbar
│   │   ├── NotificationBell.tsx  # Realtime bell
│   │   └── PollCard.tsx          # Poll tile with actions
│   ├── lib/
│   │   ├── api.ts                # Full API client
│   │   ├── types.ts              # TypeScript types
│   │   └── utils.ts              # Utilities
│   ├── context/AppContext.tsx    # Auth + Pusher + notifications
│   └── hooks/
│       ├── useAuth.ts
│       └── usePusher.ts
├── api/
│   └── index.js                  # Express serverless (CommonJS)
├── scripts/
│   └── migrate.cjs               # Neon DB migration + seed
├── vercel.json                   # Vite SPA + API rewrites
├── .env.example                  # All required env vars
└── README.md
```

---

## 🚀 Deploy in 5 Steps

### Step 1 — Clone & install
```bash
unzip omnipoll-v3.zip
cd omnipoll
npm install
```

### Step 2 — Set up Neon DB
1. Go to [neon.tech](https://neon.tech) → Create project → Copy **Connection string**
2. Run migration:
```bash
DATABASE_URL="postgresql://..." node scripts/migrate.cjs
```
This creates all tables and seeds demo accounts.

### Step 3 — Set up Pusher
1. Go to [pusher.com](https://pusher.com) → Create app → **Channels**
2. Note: App ID, Key, Secret, Cluster (use `ap2` for India)

### Step 4 — Push to GitHub
```bash
git init
git add .
git commit -m "OmniPoll v3 GODMODE"
git remote add origin https://github.com/YOUR_USERNAME/omnipoll.git
git push -u origin main
```

### Step 5 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Vercel auto-detects **Vite** — no settings needed
3. Add these **Environment Variables**:

| Variable | Value | Where to get |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | neon.tech → Connection string |
| `JWT_SECRET` | Any 32+ char random string | Generate with `openssl rand -base64 32` |
| `PUSHER_APP_ID` | `123456` | pusher.com → App Keys |
| `PUSHER_KEY` | `abc123...` | pusher.com → App Keys |
| `PUSHER_SECRET` | `secret...` | pusher.com → App Keys |
| `PUSHER_CLUSTER` | `ap2` | pusher.com → App Keys |
| `VITE_PUSHER_KEY` | Same as PUSHER_KEY | — |
| `VITE_PUSHER_CLUSTER` | `ap2` | — |
| `VITE_API_BASE` | `/api` | — |

4. Click **Deploy** — done in ~45 seconds!

---

## 🎓 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Teacher | `demo@omnipoll.io` | `demo1234` |
| Student | `student@omnipoll.io` | `student123` |

---

## 📊 20 Poll Types

| Type | Description |
|---|---|
| Multiple Choice | Single-select with optional correct answer |
| Quiz | Scored quiz with timer, negative marking |
| Word Cloud | Free-text, rendered as live word cloud |
| Q&A | Audience questions with upvoting |
| NPS Score | Net Promoter Score (0–10) |
| Star Rating | 1–5 star rating |
| Slider | Numeric range slider |
| Ranking | Drag-and-drop ordering |
| Matrix Grid | Row × Column radio grid |
| 100-Point Priority | Allocate points across options |
| Heatmap Click | Click on an image/area |
| Emoji Reactions | Pick an emoji response |
| Bracket Vote | Tournament-style elimination |
| Fill in the Blank | Text completion |
| Live Matching | Match pairs |
| True / False | Binary choice |
| Image Choice | Pick from images |
| Countdown Timer | Timed announcement |
| Poll Series | Multiple questions in sequence |
| Open Ended | Free-text response |

---

## 🔄 User Flows

### Teacher Flow
```
Sign Up → Dashboard → Create Poll (5-step wizard)
→ Share code/QR → Monitor Live Results
→ Close Poll → Release Results
→ Students notified → Deep Analytics
```

### Student Flow
```
Join via code → Participate (with timer)
→ Submit → See score → View Key Sheet
→ (When released) Detailed answer breakdown
```

### Classroom Flow
```
Teacher creates classroom → Students join with code
→ Teacher assigns polls to classroom
→ All results tracked per student
→ Classroom leaderboard
```

---

## ⚡ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3 + Framer Motion |
| State | TanStack Query v5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Real-time | Pusher Channels (free tier) |
| Backend | Express.js (Vercel serverless) |
| Database | Neon PostgreSQL (serverless) |
| Auth | JWT + bcryptjs |
| Deploy | Vercel (free tier) |

---

## 🛠️ Local Development

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — API (needs vercel CLI)
npm install -g vercel
vercel dev

# Or set VITE_API_BASE to your deployed API URL for quick testing
```

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
# Fill in your DATABASE_URL, PUSHER_*, JWT_SECRET
```

---

## 📁 Vercel Project Settings (if needed)

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | *(blank)* |

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (cost 10)
- JWT tokens expire in 30 days
- Poll access controlled by status + ownership
- Key sheets only accessible after `results_released`
- Pusher private channels for user notifications
- HTTPS enforced via Vercel

---

Built with ❤️ — OmniPoll v3 GODMODE

---

## 🔧 Fix: ECONNREFUSED on Local Dev

The `connect ECONNREFUSED` error appears **only in local development** because the Vite dev server doesn't run the Express API. Fix it in **two** terminal tabs:

**Terminal 1 — API server:**
```bash
cp .env.example .env
# Edit .env and fill in DATABASE_URL, JWT_SECRET, PUSHER_* values
npm run dev:api
# → API running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# → App running at http://localhost:8080
# Vite automatically proxies /api/* → localhost:3001
```

> **On Vercel (production):** This error never occurs. Vercel runs `api/index.js` as a serverless function automatically.

---

## 📁 Pages & Routes

| Route | Page | Auth |
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
