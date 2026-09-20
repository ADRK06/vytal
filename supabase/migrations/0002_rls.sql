-- Row Level Security, now that auth exists (see 0001_init.sql's TODO).
-- The browser client runs as the signed-in user (via their JWT), so these
-- policies are the actual enforcement boundary — app-level filtering in
-- lib/sessions.ts is a defense-in-depth nicety on top of this, not the
-- thing that makes cross-user access impossible.
--
-- POST /api/ingest (the ESP32 mouse) has no user session at all, so it uses
-- the service-role client instead (lib/supabase/service.ts), which bypasses
-- RLS entirely — that's why hydration_readings has no insert policy below.

alter table sessions enable row level security;
alter table posture_readings enable row level security;
alter table hydration_readings enable row level security;

create policy "Users can view their own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on sessions for update
  using (auth.uid() = user_id);

create policy "Users can view their own posture readings"
  on posture_readings for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = posture_readings.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can add posture readings to their own sessions"
  on posture_readings for insert
  with check (
    exists (
      select 1 from sessions
      where sessions.id = posture_readings.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can view their own hydration readings"
  on hydration_readings for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = hydration_readings.session_id
      and sessions.user_id = auth.uid()
    )
  );
