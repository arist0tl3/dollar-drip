# Weekly Budget Tracker

A shared household budget tracker that lets multiple people log weekly expenses against a budget that resets every Monday in the household's timezone. Designed as a mobile-first PWA.

## What it is
- Shared household budget with members and weekly reset
- Fast expense logging with categories and optional notes
- Real-time-ish sync via polling
- PWA installable with offline fallback

## Stack
- Frontend: Astro + React + Tailwind
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

## Local development

### Frontend
```bash
cd client
npm install
npm run dev
```

### Backend API
```bash
cd server
npm install
npm run dev
```

The frontend expects an API URL via `PUBLIC_API_URL` (defaults to `http://localhost:3001`).

## Environment

Backend (`server/.env`):
- `MONGODB_URI`
- `PORT` (optional)
- `APP_URL` (used for invite links)
- `CORS_ORIGIN` (comma-separated)

Frontend (`client/.env`):
- `PUBLIC_API_URL`

## Project structure
- `client/src/components/BudgetApp.jsx`: main UI and client logic
- `server/index.js`: API routes
- `server/models/*`: Mongoose models
- `client/public/manifest.webmanifest`, `client/public/sw.js`: PWA assets

## Notes
- Sessions persist until logout.
- Transactions are soft-deleted (`deletedAt`).
- Weekly reset is computed per household timezone.
