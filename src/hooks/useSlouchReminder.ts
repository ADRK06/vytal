"use client";

import { useEffect, useRef, useState } from "react";

const SLOUCH_THRESHOLD = 50;
// "Sustained" per the task's 15-20s window.
const SUSTAINED_MS = 18000;
// Gentle nudge, not nagging — nothing else fires for a few minutes after
// one does, even if the score never recovers above threshold.
const COOLDOWN_MS = 3 * 60 * 1000;
// How long the in-app toast stays up before clearing itself.
const TOAST_DISPLAY_MS = 6000;

const REMINDER_MESSAGE = "You've been slouching for a bit — sit up straight.";

// Watches the live posture score and, once it's stayed continuously below
// SLOUCH_THRESHOLD for SUSTAINED_MS, fires a reminder: a browser
// Notification if permission has been granted (requested lazily, only
// once an actual slouch is detected — never unprompted on mount), and
// always an in-app toast too, so the nudge lands even if notifications
// were denied or the tab isn't focused to see one.
export function useSlouchReminder(score: number | null) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const belowSinceRef = useRef<number | null>(null);
  const lastFiredAtRef = useRef(0);
  const permissionRequestedRef = useRef(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (score === null || score >= SLOUCH_THRESHOLD) {
      belowSinceRef.current = null;
      return;
    }

    const now = Date.now();
    if (belowSinceRef.current === null) belowSinceRef.current = now;

    const sustainedFor = now - belowSinceRef.current;
    const cooledDown = now - lastFiredAtRef.current > COOLDOWN_MS;
    if (sustainedFor < SUSTAINED_MS || !cooledDown) return;

    lastFiredAtRef.current = now;

    setToastMessage(REMINDER_MESSAGE);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), TOAST_DISPLAY_MS);

    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification("VYTAL", { body: REMINDER_MESSAGE });
    } else if (Notification.permission === "default" && !permissionRequestedRef.current) {
      // Only asked the first time a slouch is actually sustained — not on
      // page load, so the permission prompt has an obvious reason.
      permissionRequestedRef.current = true;
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("VYTAL", { body: REMINDER_MESSAGE });
        }
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
