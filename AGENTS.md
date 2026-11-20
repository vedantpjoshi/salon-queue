# AGENTS.md — Glamour Queue (Salon Queue Management)

Web app for a salon: browse services on your phone, book and get a token,
stylist board shows the queue, TV displays Now Serving.

## Read first
- docs/01-brief.md        -> features + what NOT to build
- docs/02-screens.md      -> every screen's layout and behaviour
- docs/03-flows-rules.md  -> flows, rules, test checklist

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express + Socket.IO; local SQLite via sql.js, hosted PostgreSQL via pg
- Run locally: `npm run dev` (starts both frontend on :5173 and backend on :3001)
- Production: `npm run build && npm start`

## How to work
- Build one screen or one feature per task. Don't touch other screens.
- Mobile-first (390px wide), then make it look good on a laptop.
- Violet accent (#7C3AED), rounded cards, large tap targets.
- Use realistic Indian salon services with ₹ prices.
- Never add features from the 'Don't build' list.
- After each task: list changed files and how to test the change.
