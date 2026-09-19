import { NextResponse } from "next/server";

// TODO: accepts { session_id, raw_gsr, raw_ppg, timestamp } from the ESP32 mouse,
// runs the hydration scoring function, writes to hydration_readings.
// This is the contract the hardware teammate's firmware depends on — don't
// change its shape without telling them.
export async function POST(request: Request) {
  return NextResponse.json({ ok: true });
}
