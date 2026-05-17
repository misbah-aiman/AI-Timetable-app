# AI Timetable

A full-stack AI-powered timetable web app that generates personalized daily/weekly schedules using OpenAI GPT, with time tracking, analytics, and a modern SaaS-style UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-3.5-turbo |
| Auth | JWT (jsonwebtoken) |

---

## Folder Structure

```
Ai-Timetable/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # Express route definitions
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── utils/          # OpenAI helper
│   │   └── server.ts       # Entry point
│   ├── .env                # Your secrets (never commit!)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI + feature components
│   │   ├── contexts/       # Auth + Theme React contexts
│   │   ├── hooks/          # Custom hooks (useTimer)
│   │   ├── pages/          # Route-level page components
│   │   ├── services/       # Axios API client
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # localStorage helpers
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) OR a MongoDB Atlas connection string
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

---

### 1. Clone / open the project

```bash
cd /path/to/Ai-Timetable
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-timetable
JWT_SECRET=pick_a_long_random_string_here
OPENAI_API_KEY=sk-your-openai-key-here
```

Start the backend dev server:

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server on port 3000
npm run dev
```

Open your browser at **http://localhost:3000**

> The Vite dev server proxies all `/api/*` requests to `localhost:5000`, so CORS is handled automatically in development.

---

## Features Walkthrough

### Auth
- Sign up / log in with email + password
- JWT stored in localStorage, auto-attached to every API request
- Invalid/expired tokens redirect to login automatically

### Onboarding (5-step wizard)
1. **Sleep** — Set bedtime, wake time, sleep goal
2. **Study** — Daily study hours, subjects
3. **Hobbies** — Pick from preset list
4. **Screen Time** — Set daily limit
5. **Classes** — Add fixed recurring lectures

After step 5 the app calls OpenAI to generate your personalized weekly timetable.

### Dashboard
- Today's greeting + date
- Stats cards: study time, sleep, screen time, sessions
- Full weekly timetable with day tabs
- Embedded time tracker

### Time Tracker
- Start/stop sessions for: Study, Sleep, Screen Time, Exercise, Hobby
- Live timer per session
- Today's totals at a glance

### Analytics
- Weekly productivity score (0–100)
- Bar chart: daily study/sleep/screen hours
- Radar chart: activity balance
- Goal indicators (study goal met? sleep goal met? screen limit met?)

### Settings
- Edit display name
- Adjust routine preferences (sliders)
- Toggle light/dark theme
- Save & regenerate timetable with new preferences
- Delete account (removes all data)

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### User
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/onboarding` | Save onboarding data |
| PUT | `/api/user/settings` | Update routine preferences |
| DELETE | `/api/user/account` | Delete account + all data |

### Timetable
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/timetable/generate` | Generate AI timetable |
| GET | `/api/timetable` | Get active timetable |
| GET | `/api/timetable/today` | Get today's schedule |

### Sessions (Time Tracker)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start a tracking session |
| PUT | `/api/sessions/:id/stop` | Stop a session |
| GET | `/api/sessions/active` | Get active sessions |
| GET | `/api/sessions/today` | Get today's completed sessions |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/weekly` | Weekly stats + productivity score |
| GET | `/api/analytics/stats` | Today's quick stats (for dashboard) |

---

## Environment Variables

Only the backend needs environment variables. **Never put your OpenAI key in the frontend.**

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs (use a long random string) |
| `OPENAI_API_KEY` | Your OpenAI secret key |

---

## Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve the dist/ folder with any static server (nginx, Vercel, etc.)
```

---

## Common Issues

| Problem | Fix |
|---|---|
| "Failed to connect to MongoDB" | Make sure `mongod` is running or check your Atlas URI |
| "Failed to generate timetable" | Check your `OPENAI_API_KEY` in `.env` |
| Frontend shows blank page | Make sure backend is running on port 5000 |
| TypeScript errors on build | Run `npm install` in both folders |
