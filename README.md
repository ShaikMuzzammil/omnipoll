# OmniPoll v2 — Real-time Polling Platform

> A full-stack, production-ready polling platform built with **Next.js 14**, **Neon PostgreSQL**, and **Pusher Channels**. Deploy to Vercel in minutes.

![OmniPoll](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![Neon](https://img.shields.io/badge/Neon-PostgreSQL-brightgreen?logo=postgresql) ![Pusher](https://img.shields.io/badge/Pusher-Channels-purple) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## ✨ Features

### 20 Poll Types
| Type | Description |
|------|-------------|
| 📊 Multiple Choice | Real-time vote bars with live percentages |
| ☁️ Word Cloud | Aggregated words sized by frequency |
| ❓ Q&A Session | Submit & upvote audience questions |
| 🏆 Live Quiz | Timed questions with scoring + leaderboard |
| ⭐ Rating Scale | 1–10 scale with distribution chart |
| 🔢 Ranking | Drag-to-order with aggregated rankings |
| 💬 Open Text | Free-form text response collection |
| 🖼️ Image Choice | Visual poll with image options |
| 📈 NPS Score | Net Promoter Score (0–10) with breakdown |
| 🗃️ Matrix Grid | Rows × columns radio grid |
| 🎚️ Slider | Continuous value with distribution |
| ✅ True / False | Binary choice |
| ✏️ Fill the Blank | Complete-the-sentence |
| 🥊 Bracket Vote | Tournament-style elimination |
| 🎯 Prioritization | Allocate 100 points across options |
| 🔥 Heatmap | Click-on-image spatial voting |
| 😊 Emoji Reaction | React with 10 emojis |
| 📋 Poll Series | Sequential multi-part poll |
| ⏳ Countdown Vote | Options with time pressure |
| 🔗 Live Matching | Match two columns |

### Platform
- 🚀 **One-click Vercel deploy** — no Render or separate backend needed
- 🗄️ **Neon PostgreSQL** — serverless, scalable, free tier available
- ⚡ **Pusher Channels** — real-time updates (free tier: 100 connections, 200K msg/day)
- 🔐 **JWT Authentication** — sign up, log in, protected routes
- 📱 **Fully responsive** — works on mobile, tablet, desktop
- 🎨 **OmniPoll visual style** — Playfair Display + Inter, warm cream palette, terracotta accents
- 🌙 **Dark mode** — toggle in sidebar
- 📤 **CSV export** for results
- 📋 **12 ready-made templates**

---

## 🚀 Quick Deploy to Vercel

### Step 1 — Clone or unzip
```bash
# Unzip the project
unzip omnipoll.zip
cd omnipoll
npm install
```

### Step 2 — Set up Neon PostgreSQL (free)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project — name it `omnipoll`
3. Copy the **Connection string** (starts with `postgresql://`)

Run the migration to create tables:
```bash
DATABASE_URL="your-neon-connection-string" node scripts/migrate.mjs
```

### Step 3 — Set up Pusher Channels (free)
1. Go to [pusher.com](https://pusher.com) and sign up free
2. Create app → **Channels** → name: `omnipoll`
3. Cluster: **`ap2`** (Mumbai, best for South Asia)
4. Go to **App Keys** tab and copy: `app_id`, `key`, `secret`, `cluster`

### Step 4 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial OmniPoll v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/omnipoll.git
git push -u origin main
```

### Step 5 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Import repository
2. **Framework**: Next.js (auto-detected)
3. **Root directory**: `.` (leave default)
4. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (from Neon) |
| `JWT_SECRET` | Any random 32+ char string |
| `PUSHER_APP_ID` | From Pusher App Keys |
| `PUSHER_KEY` | From Pusher App Keys |
| `PUSHER_SECRET` | From Pusher App Keys |
| `PUSHER_CLUSTER` | `ap2` |
| `NEXT_PUBLIC_PUSHER_KEY` | Same as `PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap2` |

5. Click **Deploy** ✅

---

## 🏠 Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# → Fill in your DATABASE_URL, JWT_SECRET, PUSHER_* values

# Run DB migration
node scripts/migrate.mjs

# Start dev server
npm run dev
# → Open http://localhost:3000
```

**Demo credentials** (created by migration):
- Email: `demo@omnipoll.io`
- Password: `demo1234`

---

## 📁 Project Structure

```
omnipoll/
├── app/
│   ├── api/                    # Next.js API routes (serverless)
│   │   ├── auth/signup/        # POST — create account
│   │   ├── auth/signin/        # POST — login
│   │   ├── polls/              # GET list, POST create
│   │   ├── polls/[id]/         # GET, DELETE
│   │   ├── polls/[id]/vote/    # POST — submit response
│   │   ├── polls/[id]/results/ # GET — computed results
│   │   ├── polls/[id]/status/  # PATCH — live/paused/closed
│   │   ├── polls/[id]/qa/      # GET + POST Q&A questions
│   │   ├── polls/[id]/qa/[qid]/upvote/   # PUT — upvote
│   │   ├── polls/[id]/qa/[qid]/moderate/ # PATCH — host controls
│   │   ├── join/               # GET ?code=XXXX — join by code
│   │   └── analytics/dashboard/ # GET stats
│   ├── (auth)/                 # Login + signup pages
│   ├── dashboard/              # Poll management
│   ├── create/                 # 5-step poll creation wizard
│   ├── participate/[code]/     # Voting UI (all 20 types)
│   ├── present/[id]/           # Full-screen live results (host)
│   ├── results/[id]/           # Detailed analytics
│   ├── analytics/              # Overview dashboard
│   ├── templates/              # 12 pre-built templates
│   ├── settings/               # Profile & plan settings
│   └── join/                   # Enter join code
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── DashboardLayout.tsx     # Sidebar + header shell
├── lib/
│   ├── db.ts                   # Neon SQL helpers
│   ├── auth.ts                 # JWT sign/verify
│   ├── pusher.ts               # Pusher server client
│   ├── api.ts                  # Client-side fetch helpers
│   ├── types.ts                # All TypeScript types
│   └── utils.ts                # cn(), genId(), genCode()
├── hooks/
│   ├── useAuth.ts              # Auth state + localStorage
│   └── usePusher.ts            # Subscribe to poll channel
└── scripts/
    └── migrate.mjs             # Creates all DB tables + demo user
```

---

## 🗄️ Database Schema

5 tables, auto-created by `migrate.mjs`:

```
users           — id, name, email, password_hash, plan
polls           — id, code, title, question, type, status, settings, options, quiz_questions, creator_id, ...
poll_responses  — id, poll_id, participant_id, answer (JSONB), is_correct, score, ...
qa_questions    — id, poll_id, question_text, upvotes, status, participant_id
quiz_submissions — id, poll_id, participant_id, score, correct, answers (JSONB)
```

---

## ⚡ Real-time Architecture

```
Participant votes → POST /api/polls/[id]/vote
                    → Neon: INSERT poll_response
                    → Pusher: trigger('poll-{id}', 'results-update', results)
                    ↓
Present / Participate page
    ← Pusher channel subscription: poll-{id}
    ← updates results in <1 second
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#D96C4A` (terracotta) |
| Background | `hsl(42, 33%, 93%)` (warm cream) |
| Card | `hsl(40, 60%, 99%)` (warm white) |
| Heading font | Playfair Display (serif) |
| Body font | Inter (sans-serif) |
| Mono font | JetBrains Mono |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + tailwindcss-animate |
| Animations | Framer Motion |
| Charts | Recharts |
| Database | Neon PostgreSQL (`@neondatabase/serverless`) |
| Real-time | Pusher Channels |
| Auth | JWT (`jose`) + bcrypt |
| UI Components | Radix UI primitives |
| Icons | Lucide React |
| Toasts | Sonner |
| Deploy | Vercel |

---

## 🐛 Troubleshooting

**Blank page on Vercel?**
- Check all env vars are set (especially `DATABASE_URL` and `JWT_SECRET`)
- Run the migration: `node scripts/migrate.mjs`
- Check Vercel Function logs for errors

**Real-time not working?**
- Verify all 6 Pusher env vars are set (including `NEXT_PUBLIC_*` ones)
- Cluster must match — use `ap2` for South Asia

**DB connection error?**
- Neon free tier suspends after inactivity — first request wakes it (takes ~2s)
- Ensure `?sslmode=require` is in your `DATABASE_URL`

---

## 📄 License

MIT — use freely for personal and commercial projects.
