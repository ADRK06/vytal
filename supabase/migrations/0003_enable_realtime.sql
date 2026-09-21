-- Enables Realtime replication for the tables the dashboard subscribes to
-- (lib/supabase/realtime.ts). Without this, INSERTs succeed normally —
-- confirmed via posture_readings/hydration_readings actually filling up —
-- but Supabase never broadcasts them over the Realtime websocket, so a
-- subscribed client waits until the disconnect timeout and reports
-- "sensor appears disconnected" even though writes are working fine.
alter publication supabase_realtime add table posture_readings;
alter publication supabase_realtime add table hydration_readings;
