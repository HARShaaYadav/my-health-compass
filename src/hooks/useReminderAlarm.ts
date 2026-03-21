import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export interface AlarmReminder {
  _id: string;
  medicineName: string;
  dosage: string | null;
  times: string[];
  isActive: boolean;
  endDate: string | null;
}

// Key: `reminderId_HH:MM` → timestamp when it was last fired (to avoid duplicates)
const FIRED_KEY = "alarm_fired";

function getFired(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch { return {}; }
}

function markFired(key: string) {
  const fired = getFired();
  fired[key] = Date.now();
  // prune entries older than 24h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(fired).forEach((k) => { if (fired[k] < cutoff) delete fired[k]; });
  localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
}

function wasFiredRecently(key: string): boolean {
  const fired = getFired();
  const ts = fired[key];
  if (!ts) return false;
  // consider "recently" = within last 60 seconds (prevents double-fire in same minute)
  return Date.now() - ts < 60 * 1000;
}

export function useReminderAlarm(onAlarm: (reminder: AlarmReminder, time: string) => void) {
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;

  const check = useCallback(async () => {
    try {
      const reminders = await api.get<AlarmReminder[]>("/reminders");
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = now.toISOString().split("T")[0];

      for (const r of reminders) {
        if (!r.isActive) continue;
        if (r.endDate && r.endDate < today) continue;

        for (const t of r.times) {
          const key = `${r._id}_${t}`;
          if (t === hhmm && !wasFiredRecently(key)) {
            markFired(key);
            onAlarmRef.current(r, t);

            // Browser notification if tab is hidden
            if (document.hidden && "Notification" in window && Notification.permission === "granted") {
              new Notification(`💊 Medicine Reminder`, {
                body: `Time to take ${r.medicineName}${r.dosage ? ` (${r.dosage})` : ""} at ${t}`,
                icon: "/favicon.svg",
              });
            }
          }
        }
      }
    } catch { /* silently ignore — user may not be logged in */ }
  }, []);

  useEffect(() => {
    // Request notification permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check immediately, then every 30 seconds
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [check]);
}
