# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (both servers together)
```bash
npm run dev          # starts backend (port 5000) + frontend (port 3000) concurrently
npm run install:all  # install deps for root, backend, and frontend
```

### Backend only
```bash
cd backend
npm run dev    # nodemon + ts-node, hot-reload on src/ changes
npm run build  # tsc → dist/
npm start      # node dist/src/server.js
```

### Frontend only
```bash
cd frontend
npm run dev    # Vite dev server on port 3000
npm run build  # tsc + vite build → dist/
```

There are no tests in this project.

## Architecture

### Monorepo layout
```
Ai-Timetable/
├── api/index.ts          # Vercel serverless entry — imports backend/src/app
├── backend/src/          # Express + TypeScript API
└── frontend/src/         # React 18 + TypeScript + Vite SPA
```

The root `vercel.json` routes `/api/*` to the `api/` serverless function and everything else to `frontend/dist/index.html`. The `backend/vercel.json` is a separate config for standalone backend deployment.

### Backend (`backend/src/`)

**Entry flow:** `server.ts` → calls `connectDB()` then starts Express from `app.ts`.

`app.ts` mounts all route groups under `/api/*` and configures CORS from `ALLOWED_ORIGINS` env var.

**Route → Controller → Model pattern:**
- `routes/` — thin Express routers, all protected routes use the `authenticate` middleware
- `controllers/` — request/response logic
- `models/` — Mongoose schemas (User, Timetable, Session, Task, Analytics)
- `middleware/auth.ts` — JWT verification; attaches `req.userId` via `AuthRequest` interface
- `utils/openai.ts` — timetable generation with GPT-3.5-turbo + algorithmic fallback when quota is exceeded; also image scanning via GPT-4o-mini Vision
- `utils/email.ts` — OTP emails via Gmail SMTP (nodemailer)

**Auth flow:** passwordless OTP only. `check-email` → `send-otp` (bcrypt-hashed, 10 min TTL, 60 s cooldown) → `verify-otp` → JWT (7d expiry).

### Frontend (`frontend/src/`)

**Routing (`App.tsx`):** Three route guard components:
- `PublicRoute` — redirects logged-in users away from `/login` and `/signup`
- `PrivateRoute` — redirects unauthenticated users to `/login`
- `OnboardedRoute` — also checks `onboardingCompleted`; falls back to `localStorage` to avoid a React context race condition right after the onboarding wizard finishes

**State:** `AuthContext` holds `user`, `token`, and auth actions. On mount it validates the stored JWT against `GET /api/auth/me`; a 401 on that specific call triggers a full logout. `ThemeContext` handles light/dark theming.

**API layer (`services/api.ts`):** Single Axios instance. In dev, Vite proxies `/api` → `localhost:5000` so no absolute URL is needed. In production, set `VITE_API_URL` to the deployed backend. JWT is injected via a request interceptor from `localStorage`.

**Key frontend flows:**
- Onboarding wizard (`OnboardingWizard.tsx`) — 5-step form that collects all `IOnboarding` fields, then triggers `POST /api/timetable/generate`
- Dashboard polls `GET /api/timetable/today` and `GET /api/analytics/stats`
- Time Tracker (`useTimer` hook + `TimeTracker` component) — start/stop sessions via `POST /api/sessions/start` and `PUT /api/sessions/:id/stop`
- Tasks page creates tasks; timetable regeneration reads pending tasks and weaves them into the AI prompt as "Study: [Task Title]" slots

**Shared types (`types/index.ts`):** Single source of truth for `User`, `OnboardingData`, `TimeSlot`, `DaySchedule`, `Session`, `Task`, `WeeklyAnalytics`, etc. — used directly by both frontend components and mirrored in the backend's `IOnboarding` interface.

### Timetable generation

`generateTimetable()` in `utils/openai.ts` builds a prompt from `IOnboarding` data (sleep times, chronotype, study style, fixed classes, pending tasks) and asks GPT-3.5-turbo to return a JSON `{ schedule: DaySchedule[] }`. On quota/rate-limit errors (`429`, `503`, `insufficient_quota`) it silently falls back to `generateFallbackTimetable()`, a pure-algorithm scheduler that produces the same JSON shape.

### Environment variables

Backend only needs a `.env` file (copy `.env.example`):
| Variable | Purpose |
|---|---|
| `PORT` | Express port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI key for timetable generation + image scanning |
| `GMAIL_USER` | Gmail address for OTP emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not account password) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Frontend production only needs `VITE_API_URL` pointing at the deployed backend.
