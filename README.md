# OmniPoll v2.0

**Real-time live polling platform** — multiple choice, word cloud, Q&A, quiz, and rating polls with live Socket.IO updates, AI sentiment analysis, and export support.

---

## 🚀 Quick Start — Standalone (No server needed)

Open `standalone.html` directly in any browser. Everything works offline using `localStorage` and `BroadcastChannel` for multi-tab sync.

---

## 🛠 Full-Stack Setup (React + Express + Socket.IO)

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development (two terminals)

**Terminal 1 – Backend API + Socket.IO:**
```bash
npm run socket-server
# → http://localhost:8787
```

**Terminal 2 – Frontend (Vite):**
```bash
npm run dev
# → http://localhost:8080
```

### Production Build

```bash
npm run build
```

Outputs to `dist/`. Serve with any static host (Vercel, Netlify, Cloudflare Pages). Point `VITE_API_URL` to your deployed backend.

---

## 📋 Features

| Feature | Standalone | Full-Stack |
|---|---|---|
| Multiple Choice polls | ✅ | ✅ |
| Word Cloud | ✅ | ✅ |
| Q&A + Upvoting | ✅ | ✅ |
| Live Quiz + Timer | ✅ | ✅ |
| Rating Scale | ✅ | ✅ |
| Real-time updates | BroadcastChannel | Socket.IO |
| AI Sentiment Analysis | ✅ | ✅ |
| Theme Extraction | ✅ | ✅ |
| CSV Export | ✅ | ✅ |
| PDF/Print Report | ✅ | ✅ |
| Participant join codes | ✅ | ✅ |
| Auth (sign up/in) | ✅ localStorage | ✅ Server |
| Multi-device sync | Same browser only | ✅ Cross-device |
| Persistence | localStorage | JSON file |

---

## 🏗 Project Structure

```
omnipoll/
├── standalone.html          ← Zero-dependency single-file app
├── index.html               ← Vite entry point
├── src/
│   ├── main.tsx
│   ├── App.tsx              ← Router
│   ├── index.css            ← Tailwind + CSS vars
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   └── ui/              ← shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useSocket.ts
│   ├── lib/
│   │   ├── api.ts           ← REST API client
│   │   ├── types.ts         ← Shared TypeScript types
│   │   └── utils.ts
│   └── pages/
│       ├── Home.tsx
│       ├── Auth.tsx
│       ├── Create.tsx       ← 3-step poll wizard
│       ├── DashboardPolls.tsx
│       ├── Results.tsx      ← Live analytics (creator)
│       └── PollView.tsx     ← Participant experience
├── server/
│   └── index.mjs            ← Express + Socket.IO backend
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🎨 Design System

The warm terracotta palette is preserved exactly from the original:

| Token | Value | Usage |
|---|---|---|
| `terracotta` | `#D96C4A` | Primary actions, accents |
| `clay` | `#C4A882` | Borders, dividers |
| `warm-white` | `#FDF9F3` | Cards, surfaces |
| `cream` | `#F5EFE4` | Hover states |
| `parchment` | `#EDE4D5` | Backgrounds, input fills |
| `charcoal` | `#2C2C2C` | Headings, body text |
| `slate` | `#6B6B6B` | Secondary text |
| `sage` | `#7B9E87` | Success, live status |
| `crimson` | `#C94040` | Error, destructive |
| Background | `hsl(42,33%,93%)` | Page background |

Fonts: **Playfair Display** (headings) + **Inter** (body) + **JetBrains Mono** (codes/numbers)

---

## 🔌 API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register user |
| `POST` | `/api/auth/signin` | Sign in |
| `POST` | `/api/polls` | Create poll |
| `GET` | `/api/polls?creatorId=` | List polls |
| `GET` | `/api/polls/:id` | Get poll + results |
| `GET` | `/api/join?code=` | Join by 6-char code |
| `POST` | `/api/polls/:id/vote` | Submit vote/response |
| `POST` | `/api/polls/:id/qa` | Submit Q&A question |
| `PUT` | `/api/polls/:id/qa/:questionId/upvote` | Upvote question |
| `POST` | `/api/polls/:id/quiz/submit` | Submit quiz answer |
| `PATCH` | `/api/polls/:id/status` | Update poll status |
| `DELETE` | `/api/polls/:id` | Delete poll |
| `GET` | `/api/polls/:id/export/csv` | Download CSV |

### Socket.IO Events

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `joinPoll` | `{ pollId }` |
| Client → Server | `joinByCode` | `{ code }` |
| Server → Client | `pollUpdate` | `{ poll, results }` |
| Server → Client | `statusChanged` | `{ status }` |

---

## 📦 Deployment

### Vercel (Frontend)
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Set env var: `VITE_API_URL=https://your-api.com`

### Railway / Render (Backend)
```bash
node server/index.mjs
```
Set env vars: `PORT=8787`, `CLIENT_ORIGIN=https://your-frontend.com`

---

## 🧠 AI Features

OmniPoll includes **client-side** AI analysis (no external API required):

- **Sentiment Analysis** — Fuzzy-match positive/negative word scoring with Levenshtein distance tolerance (typo-resistant)
- **Theme Extraction** — Word frequency clustering with fuzzy deduplication
- **Real-time** — Recalculated on every new response

---

## 📄 License

MIT — free to use, modify, and distribute.
