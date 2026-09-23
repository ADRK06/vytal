"use client";

import { useEffect, useRef, useState } from "react";
import { isSustainedSlouch, SLOUCH_SUSTAINED_FRAME_COUNT } from "@/lib/scoring";

// Gentle nudge, not nagging — nothing else fires for a few minutes after
// one does, even if the score never recovers above threshold.
const COOLDOWN_MS = 3 * 60 * 1000;
// How long the in-app toast stays up before clearing itself.
const TOAST_DISPLAY_MS = 6000;

const REMINDER_MESSAGE = "You've been slouching for a bit — sit up straight.";

// Wraps `new Notification()` with its own show/error events logged —
// the constructor itself never throws just because a notification fails
// to actually display (a denied/blocked permission, an OS-level
// notification setting, etc. all fail silently otherwise), so without
// this there is no way to tell "fired and was shown" apart from "fired
// and vanished" from the console alone.
function fireNativeNotification(body: string): void {
  try {
    const notification = new Notification("VYTAL", { body });
    notification.onshow = () => console.info("[slouch reminder] native notification shown");
    notification.onerror = () =>
      console.error(
        "[slouch reminder] native notification failed to display — check the OS's own notification settings for this browser"
      );
  } catch (error) {
    console.error("[slouch reminder] Notification constructor threw:", error);
  }
}

// Watches the live posture score and, once the CVA has read as a slouch
// (see SLOUCH_CVA_THRESHOLD_DEGREES/SLOUCH_SCORE_THRESHOLD in lib/scoring)
// for SLOUCH_SUSTAINED_FRAME_COUNT consecutive valid readings, fires a
// reminder: a browser Notification if permission has been granted
// (requested lazily, only once an actual slouch is detected — never
// unprompted on mount), and always an in-app toast too, so the nudge lands
// even if notifications were denied or the tab isn't focused to see one.
export function useSlouchReminder(score: number | null) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Rolling buffer of the most recent scores (oldest first), fed straight
  // to isSustainedSlouch — a null (missing/invalid) reading still gets
  // pushed, so it correctly breaks a streak rather than being skipped over.
  const recentScoresRef = useRef<Array<number | null>>([]);
  const lastFiredAtRef = useRef(0);
  const permissionRequestedRef = useRef(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const recentScores = recentScoresRef.current;
    recentScores.push(score);
    if (recentScores.length > SLOUCH_SUSTAINED_FRAME_COUNT) recentScores.shift();

    if (!isSustainedSlouch(recentScores)) return;

    const now = Date.now();
    const cooledDown = now - lastFiredAtRef.current > COOLDOWN_MS;
    if (!cooledDown) return;

    lastFiredAtRef.current = now;

    setToastMessage(REMINDER_MESSAGE);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), TOAST_DISPLAY_MS);

    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[slouch reminder] Notification API unavailable in this browser");
      return;
    }

    if (Notification.permission === "granted") {
      fireNativeNotification(REMINDER_MESSAGE);
    } else if (Notification.permission === "denied") {
      console.info("[slouch reminder] Notification permission denied — toast only");
    } else if (!permissionRequestedRef.current) {
      // Only asked the first time a slouch is actually sustained — not on
      // page load, so the permission prompt has an obvious reason.
      permissionRequestedRef.current = true;
      Notification.requestPermission().then((permission) => {
        console.info("[slouch reminder] Notification.requestPermission() resolved:", permission);
        if (permission === "granted") fireNativeNotification(REMINDER_MESSAGE);
      });
    }
  }, [score]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  return {
    toastMessage,
    dismiss: () => setToastMessage(null),
  };
}
