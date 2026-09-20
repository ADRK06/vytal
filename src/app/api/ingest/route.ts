import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { scoreHydration } from "@/lib/scoring";

// Accepts { session_id, raw_gsr, raw_ppg, timestamp } from the ESP32 mouse,
// runs the hydration scoring function, writes to hydration_readings.
// This is the contract the hardware teammate's firmware depends on — don't
// change its shape without telling them.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface IngestPayload {
  session_id: string;
  raw_gsr: number;
  raw_ppg: number;
  timestamp: string;
}

type ValidationResult =
  | { data: IngestPayload; errors?: undefined }
  | { data?: undefined; errors: string[] };

// A hardware device has no console to check, so every failure mode here
// returns a clear, structured JSON error rather than an opaque status code
// or a crash.
function validatePayload(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { errors: ["Request body must be a JSON object"] };
  }

  const { session_id, raw_gsr, raw_ppg, timestamp } = body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof session_id !== "string" || !UUID_PATTERN.test(session_id)) {
    errors.push("session_id must be a UUID string");
  }

  if (typeof raw_gsr !== "number" || !Number.isFinite(raw_gsr)) {
    errors.push("raw_gsr must be a finite number");
  }

  if (typeof raw_ppg !== "number" || !Number.isFinite(raw_ppg)) {
    errors.push("raw_ppg must be a finite number");
  }

  let parsedTimestamp: Date | undefined;
  if (typeof timestamp !== "string" && typeof timestamp !== "number") {
    errors.push("timestamp must be an ISO 8601 string or a Unix epoch (ms)");
  } else {
    parsedTimestamp = new Date(timestamp);
    if (Number.isNaN(parsedTimestamp.getTime())) {
      errors.push("timestamp is not a valid date");
    }
  }

  if (errors.length > 0) return { errors };

  return {
    data: {
      session_id: session_id as string,
      raw_gsr: raw_gsr as number,
      raw_ppg: raw_ppg as number,
      timestamp: (parsedTimestamp as Date).toISOString(),
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validatePayload(body);
  if (validation.errors) {
    return NextResponse.json(
      { error: "Invalid payload", details: validation.errors },
      { status: 400 }
    );
  }

  const { session_id, raw_gsr, raw_ppg, timestamp } = validation.data;
  const score = scoreHydration(raw_gsr);

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("hydration_readings")
      .insert({ session_id, raw_gsr, raw_ppg, timestamp, score })
      .select("id")
      .single();

    if (error) {
      // Postgres foreign_key_violation — session_id doesn't reference a
      // real row in sessions.
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "session_id does not reference an existing session" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, id: data.id, score }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to store hydration reading" },
      { status: 500 }
    );
  }
}
