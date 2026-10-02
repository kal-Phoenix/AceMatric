# AceMatric

All-in-one Matric exam preparation platform for Ethiopian Grade 12 students — practice questions, past national exam simulations, AI tutoring, study notes, live study rooms, and a national leaderboard.

## Features

**Students**
- **Dashboard** — readiness score, subject performance, streaks, daily challenge
- **Study Hub** — curated notes, curriculum matrix, formula sheets, YouTube lessons, AI concept explainer & tutor (Google Gemini)
- **Practice** — adaptive question practice (free tier: 10 questions/day)
- **Past Exams** — timed simulation of 160+ historical national papers with server-side grading
- **Study Rooms** — real-time chat, whiteboard, shared notes, room timer, quiz challenges
- **Leaderboard** — national rankings
- **Pro upgrade** — manual payment flow (CBE Birr / Telebirr / Bank of Abyssinia) with admin approval
- English / Amharic toggle, light / dark theme, web push notifications

**Admins**
- Admin console: analytics, user & role management, payment review, audit log
- CMS for study notes, past exams, quizzes, practice questions, and mock exams with version history and AI-assisted content generation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 |
| Backend | Express 4, WebSockets (`ws`), Zod validation |
| Database | Supabase (Postgres), service-role access with RLS hardening |
| Cache / rate limiting | Redis (`ioredis`, optional — degrades gracefully) |
| Auth | Custom JWT + rotating refresh tokens, Google & Apple OAuth |
| AI | Google Gemini (with model fallback chain) |
| Email / Push | Resend, Web Push (VAPID) |
| Monitoring | Sentry |
| Testing | Vitest + Supertest |
| Deploy | Docker (multi-stage), Render |

## Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project
- (Optional) Gemini, Resend, Redis, Sentry, VAPID keys — see `.env.example`

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Fill in the required values (server refuses to boot without them):

| Required | Optional (features degrade gracefully) |
|---|---|
| `SUPABASE_URL` | `RESEND_API_KEY` (email) |
| `SUPABASE_ANON_KEY` | `GEMINI_API_KEY` (AI) |
| `SUPABASE_SERVICE_ROLE_KEY` | `REDIS_URL` (rate-limit store, WS fan-out) |
| `JWT_SECRET` (32+ chars) | `SENTRY_DSN`, `VAPID_*`, OAuth credentials |

**3. Set up the database**

Run the SQL migrations in `server/migrations/` in the **Supabase SQL Editor**. They are applied manually — there is no migration runner.

> Note: migration prefixes are not strictly ordered (several files share `000`–`003`). For a fresh database, apply them in filename order and verify the schema afterward. `018_rls_hardening.sql` should be applied last — it revokes all direct DB access so the server's service-role client is the only privileged client.

**4. Run the dev server**

```bash
npm run dev
```

Single process on `http://localhost:4000` (set `PORT` to change) serving both the API and the Vite-powered SPA.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (tsx, Vite middleware, HMR) on port 4000 |
| `npm run build` | Build SPA (`dist/`) + bundle server (`dist/server.cjs`) |
| `npm start` | Run production bundle |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm test` | Run test suite (Vitest) |
| `npm run test:watch` | Watch mode |

## Project Structure

```
server.ts              # Process entry: env validation → Vite/API/WS → shutdown hooks
src/                   # React SPA
  App.tsx              # Stage machine (landing → auth → onboarding → main) + tab router
  components/views/    # One file per screen
  lib/supabase.ts      # Typed API client (fetch wrapper w/ token refresh)
  lib/AuthContext.tsx  # Auth state, app stage
server/                # Backend
  app.ts               # Express app, security middleware, 29 route mounts
  middleware.ts        # JWT auth, admin guard, rate limiters
  websocket.ts         # Study rooms: chat, whiteboard, timer
  routes/              # API routers (auth, ai, payments, usage, ...)
  migrations/          # SQL migrations (manual, Supabase SQL Editor)
  db.ts, env.ts        # Supabase clients, env validation
shared/                # Code shared by client and server
tests/                 # Vitest suites (mocked Supabase, supertest route tests)
storage/               # Local content JSON (gitignored — see note below)
public/                # Service worker, manifest, static assets
```

### Local content store

`storage/` holds source content (`content.json`, 160+ past-exam JSON files) and is **gitignored** — it exists only on your machine. The data that matters lives in Supabase; the local files are import sources. Back them up independently.

## Deployment

```bash
docker build -t acematric .
docker run -p 3000:3000 --env-file .env acematric
```

The Docker image runs as a non-root user on port 3000 with a healthcheck at `GET /api/health`. Production config: set `NODE_ENV=production`, `APP_URL`, `ALLOWED_ORIGINS` (comma-separated; never include localhost), and a strong `JWT_SECRET`.

## License

Private — all rights reserved.
