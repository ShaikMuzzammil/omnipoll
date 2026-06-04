# OmniPoll 2.0 🗳️

> **The ultimate real-time polling platform** — 20 poll types, live conducting, AI analytics, multi-tenancy, and a beautiful presenter view.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ShaikMuzzammil/omnipoll)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Hono](https://img.shields.io/badge/Hono-4.4-orange)

---

## ✨ Features

### 20 Poll Types
| Type | Plan | Description |
|------|------|-------------|
| Multiple Choice | Free | Classic voting with live bar charts |
| Word Cloud | Free | Open text generates live word cloud |
| Q&A Session | Free | Submit & upvote questions in real-time |
| Live Quiz | Free | Timed scoring with live leaderboard |
| Rating Scale | Free | Numeric scale with distribution chart |
| Ranking | Starter | Drag-and-drop ordering |
| Open Text | Starter | Free-form with AI categorization |
| Image Choice | Starter | Options displayed as images |
| NPS Score | Starter | 0-10 scale with NPS calculation |
| Matrix Grid | Starter | Rows × columns rating grid |
| True/False | Starter | Binary choice with explanation |
| Emoji Reaction | Starter | Real-time emoji rain |
| Slider | Pro | Continuous value on a spectrum |
| Fill in the Blank | Pro | Sentence completion |
| Bracket Vote | Pro | Tournament-style elimination |
| Prioritization | Pro | Allocate 100 points across options |
| Heatmap | Pro | Click on image to mark locations |
| Poll Series | Pro | Linked multi-question sequential flow |
| Countdown Vote | Pro | Options disappear as time expires |
| Live Matching | Pro | Match items from two columns |

### Platform Features
- 🔴 **Real-time** — Socket.IO with auto-reconnect and live participant counts
- 📊 **Presenter View** — Dark-themed fullscreen mode with live result visualizations
- 🤖 **AI Moderation** — Auto-flag spam/toxic Q&A content
- 📱 **QR Join** — Instant audience join via QR code
- 🌙 **Dark Mode** — Full dark/light theme with system preference detection
- 💳 **Billing** — 4-tier plans (Free → Enterprise) with Stripe
- 📈 **Analytics** — Response trends, device breakdown, engagement metrics
- 🎨 **Templates** — 12+ ready-to-use poll templates by domain
- 🔒 **Auth** — JWT with refresh tokens

---

## 🏗️ Architecture

```
omnipoll/
├── apps/
│   ├── web/          # Vite 5 + React 18 + TypeScript
│   └── server/       # Hono.js 4 + Socket.IO 4 + Prisma
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml # PostgreSQL + Redis
└── turbo.json        # Turborepo pipeline
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3 |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| State | Zustand, TanStack Query v5 |
| Charts | Recharts, D3 |
| Routing | React Router v6 |
| Backend | Hono.js 4, Node.js 20 |
| Real-time | Socket.IO 4 |
| Auth | JWT (jose), bcryptjs |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 |
| Deployment | Vercel (web), Railway (server) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for local PostgreSQL + Redis)

### 1. Clone & Install
```bash
git clone https://github.com/ShaikMuzzammil/omnipoll.git
cd omnipoll
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example apps/server/.env
cp .env.example apps/web/.env.local
```

Edit `apps/server/.env`:
```env
DATABASE_URL=postgresql://omnipoll:omnipoll@localhost:5432/omnipoll
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3001
```

Edit `apps/web/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Run Dev Servers
```bash
pnpm dev
```

This starts:
- **Frontend** → http://localhost:5173
- **Backend** → http://localhost:3001

### 5. Demo Login
```
Email: demo@omnipoll.io
Password: demo1234
```

---

## 📦 Deployment

### Frontend → Vercel

1. Push to GitHub (already done)
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory**: `apps/web`
4. Set **Framework**: Vite
5. Add environment variables:
   - `VITE_API_URL` → your Railway backend URL
   - `VITE_SOCKET_URL` → your Railway backend URL

### Backend → Railway

1. Create new Railway project
2. Add PostgreSQL and Redis services
3. Deploy from GitHub, set **Root Directory**: `apps/server`
4. Set environment variables from `.env.example`
5. Run `pnpm db:push` to apply schema

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |

### Polls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls` | List user's polls |
| POST | `/api/polls` | Create poll |
| GET | `/api/polls/:id` | Get poll + results |
| PATCH | `/api/polls/:id` | Update poll |
| DELETE | `/api/polls/:id` | Delete poll |
| GET | `/api/polls/join/:code` | Join by code |
| POST | `/api/polls/:id/vote` | Submit vote |

### Socket.IO Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `host-join` | Client→Server | Host joins poll room |
| `go-live` | Client→Server | Start poll |
| `close-poll` | Client→Server | End poll |
| `submit-vote` | Client→Server | Audience submits answer |
| `results-update` | Server→Client | Live results push |
| `participant-joined` | Server→Client | Audience count update |

---

## 🎨 Design System

Custom OmniPoll design tokens:

```css
--terracotta: #E07A5F   /* Primary CTA */
--sage: #81B29A         /* Success / positive */
--charcoal: #2D3748     /* Primary text */
--parchment: #F4EDE4    /* Light background */
--clay: #B5927A         /* Borders, subtle */
--crimson: #C84B4B      /* Danger / error */
```

---

## 📁 Project Structure

```
apps/web/src/
├── pages/          # Route-level components (all 18 pages)
├── components/     # Shared UI components
├── hooks/          # Custom React hooks
├── store/          # Zustand stores (auth, theme, polls)
├── lib/            # API client, utilities
└── types.ts        # All TypeScript types & constants

apps/server/src/
├── routes/         # Hono route handlers
├── middleware/     # Auth middleware
├── socket.ts       # Socket.IO event handlers
├── db.ts           # In-memory store (swap Prisma)
└── index.ts        # App bootstrap
```

---

## 🛣️ Roadmap

- [ ] Switch in-memory store → Prisma + PostgreSQL
- [ ] Stripe billing integration
- [ ] OpenAI text analysis for open responses
- [ ] Custom branding / white-label
- [ ] React Native mobile app
- [ ] Webhook system for poll events
- [ ] CSV / PDF export
- [ ] SAML SSO

---

## 📄 License

MIT © Shaik Muzzammil
