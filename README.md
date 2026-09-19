# VYTAL

VYTAL is a desk wellness web app that watches two things at once: your posture, via on-device webcam pose detection, and your hydration, via a custom mouse with embedded GSR/PPG sensors. Both feed a live dashboard so you can see how the two relate over the course of a session — no video ever leaves your browser.

This repo is the software side only: the web portal, the posture pipeline, and the backend. The physical mouse and its firmware live in a separate hardware teammate's codebase.

## Tech stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Charts:** Recharts
- **Posture detection:** MediaPipe Pose Landmarker (`@mediapipe/tasks-vision`), client-side
- **Backend:** Supabase (Postgres + Auth + Realtime)
- **Hosting:** Vercel

## Setup

```bash
git clone <repo-url>
cd vytal
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
npm run dev
```

## Team workflow

- `git clone <repo-url>`
- `cd vytal`
- `git checkout -b <your-name>/<feature>` — branch off `main`, never commit directly to `main`
- normal add/commit/push cycle on that branch
- open a pull request into `main` when ready for review
