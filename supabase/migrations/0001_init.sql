-- VYTAL initial schema
-- TODO: add RLS policies once auth flow is finalized.

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists posture_readings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  timestamp timestamptz not null default now(),
  score numeric not null
);

create table if not exists hydration_readings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  timestamp timestamptz not null default now(),
  score numeric not null,
  raw_gsr numeric,
  raw_ppg numeric
);

create index if not exists posture_readings_session_id_idx on posture_readings (session_id);
create index if not exists hydration_readings_session_id_idx on hydration_readings (session_id);
