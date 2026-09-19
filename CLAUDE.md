# CLAUDE.md

Project context for Claude Code. Read this before making changes.

## What this is

VYTAL is a desk wellness web app built by a 3-person student team. It has two sensing halves feeding one live dashboard:

1. **Posture** — the user's webcam detects slouching in real time (client-side, on-device, no video leaves the browser).
2. **Hydration** — a mouse with embedded sensors (GSR + PPG) streams readings over WiFi to detect dehydration.

Both signals write to a shared backend and render live on a portal where the user watches their own session: posture score, hydration score, and a correlation view between the two over time.

This repo is the **software side only** — the web portal, posture pipeline, and backend. The physical mouse and its firmware are a separate teammate's ESP32/Arduino codebase; this repo only consumes the JSON it POSTs.

## Tech stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion — used sparingly, one orchestrated moment per view, not per-element hover/fade defaults
- **Charts:** Recharts
- **Posture detection:** MediaPipe Pose Landmarker (`@mediapipe/tasks-vision`), runs entirely client-side in the browser
- **Backend:** Supabase (Postgres + Auth + Realtime) — no custom server to maintain
- **Hosting:** Vercel

## Architecture

```
Browser (webcam) --MediaPipe--> posture score --> Supabase (posture_readings)
ESP32 mouse (GSR+PPG) --POST /api/ingest--> Supabase (hydration_readings)
Dashboard <--Supabase Realtime subscription-- both tables
```

The dashboard never polls — it subscribes to Supabase Realtime channels on `posture_readings` and `hydration_readings` filtered by the active `session_id`.

## Data model (Supabase)

- **`sessions`**: `id`, `user_id`, `started_at`, `ended_at`
- **`posture_readings`**: `id`, `session_id`, `timestamp`, `score` (0–100)
- **`hydration_readings`**: `id`, `session_id`, `timestamp`, `score` (0–100), `raw_gsr`, `raw_ppg`

`score` fields are always the calibrated 0–100 value the dashboard displays. Raw sensor values are kept alongside for hydration so the scoring function can be recalibrated later without losing data.

## API routes

- **`POST /api/ingest`** — accepts `{ session_id, raw_gsr, raw_ppg, timestamp }` from the ESP32, runs the hydration scoring function, writes to `hydration_readings`. This is the one contract the hardware teammate's firmware depends on — don't change its shape without telling them.

## Design system

Carry these tokens through every new screen rather than reinventing per-component:

- **Colors:** background `#0A0E12`, hydration/teal accent `#5EEAD4`, posture/coral accent `#FF7A59`, text `#EDF2F1`, dimmed text `#8FA0A3`, glass fill `rgba(255,255,255,0.055)` with `backdrop-filter: blur(18px)`
- **Type:** Space Grotesk for headings/UI, IBM Plex Mono for live metric readouts and data labels
- **Motion:** load-in reveals only; no scattered hover animations on every card

Posture is always coral, hydration is always teal — don't swap these once a chart or screen uses them, since users learn the color coding across the app.

## Conventions

- Client components that touch the webcam or MediaPipe must be explicitly marked `"use client"` and should degrade gracefully (clear message, no crash) if camera permission is denied.
- Any UI showing a live score should handle the "no data yet" and "sensor disconnected" states explicitly — don't assume the stream is always live, especially for the hydration mouse, which can drop WiFi mid-session.
- Keep the calibration flow (posture baseline capture, hydration baseline capture) as its own step before a session starts, not folded into the dashboard itself.
- Prefer editing the scoring functions in one place (e.g. `lib/scoring.ts`) rather than inlining thresholds in components — the hydration scoring math will get recalibrated as real calibration data comes in from teammate testing.

## What NOT to do here

- Don't build or modify ESP32/firmware code in this repo — that's a separate codebase.
- Don't add a custom WebSocket server — Supabase Realtime already covers live updates.
- Don't introduce a second backend/database — Supabase is the single source of truth for this project.