-- Third sensing pillar: stress, derived from the same GSR/PPG payload the
-- ESP32 mouse already sends for hydration (see POST /api/ingest). Unlike
-- posture/hydration, stress is also meant to persist and be visible at
-- the day level (the /log calendar heatmap), not just per-session — that's
-- what daily_stress is for, kept in sync automatically by the trigger
-- below rather than requiring every stress_readings writer to also
-- remember to update it.

create table if not exists stress_readings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  timestamp timestamptz not null default now(),
  score numeric not null,
  raw_gsr numeric,
  raw_ppg numeric
);

create index if not exists stress_readings_session_id_idx on stress_readings (session_id);

create table if not exists daily_stress (
  date date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  avg_score numeric not null,
  reading_count integer not null default 0,
  primary key (date, user_id)
);

alter table stress_readings enable row level security;
alter table daily_stress enable row level security;

-- Same read pattern as hydration_readings: no insert policy, since only
-- the service-role client (POST /api/ingest, no user session of its own)
-- ever writes here — see supabase/migrations/0002_rls.sql.
create policy "Users can view their own stress readings"
  on stress_readings for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = stress_readings.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can view their own daily stress"
  on daily_stress for select
  using (auth.uid() = user_id);

-- Keeps daily_stress in sync incrementally (running average + count)
-- rather than the read path re-aggregating full history on every /log
-- page load. security definer so it can look up sessions.user_id
-- regardless of which role's insert fired it.
create or replace function fn_upsert_daily_stress() returns trigger as $$
declare
  v_user_id uuid;
  v_date date;
begin
  select user_id into v_user_id from sessions where id = new.session_id;
  if v_user_id is null then
    return new;
  end if;

  v_date := (new.timestamp at time zone 'utc')::date;

  insert into daily_stress (date, user_id, avg_score, reading_count)
  values (v_date, v_user_id, new.score, 1)
  on conflict (date, user_id) do update
    set avg_score = (daily_stress.avg_score * daily_stress.reading_count + excluded.avg_score)
                     / (daily_stress.reading_count + 1),
        reading_count = daily_stress.reading_count + 1;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_stress_readings_daily_aggregate
  after insert on stress_readings
  for each row execute function fn_upsert_daily_stress();

-- Same as posture_readings/hydration_readings (0003_enable_realtime.sql)
-- — the dashboard's live Stress card subscribes over Realtime.
alter publication supabase_realtime add table stress_readings;
