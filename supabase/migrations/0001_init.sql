-- VYTAL initial schema
-- TODO: add RLS policies once auth flow is finalized.

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists posture_readings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id),
  timestamp timestamptz not null default now(),
  score numeric not null
);

create table if not exists hydration_readings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id),
  timestamp timestamptz not null default now(),
  score numeric not null,
  raw_gsr numeric,
  raw_ppg numeric
);
