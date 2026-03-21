import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export interface AlarmReminder {
  _id: string;
  medicineName: string;
  dosage: string | null;
  times: string[];
  isActive: boolean;
  endDate: string | null;
}

const FIRED_KEY = "alarm_fired";
let cachedReminders: AlarmReminder[] = [];
let lastFetch = 0;
const FETCH_INTERVAL = 5 * 60 * 1000;

function getFired(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch { return {}; }
}
function markFired(key: string) {
  const fired = getFired();
  fired[key] = Date.now();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(fired).forEach((k) => { if (fired[k] < cutoff) delete fired[k]; });
  localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
}
function wasFiredRecently(key: string): boolean {
  const ts = getFired()[key];
  return !!ts && Date.now() - ts < 60_000;
}

export function useReminderAlarm(onAlarm: (reminder: AlarmReminder, time: string) => void) {
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const runCheck = async (forceFetch = false) => {
      try {
        // Always re-fetch if cache is stale or forced
        if (forceFetch || cachedReminders.length === 0 || Date.now() - lastFetch > FETCH_INTERVAL) {
          const fresh = await api.get<AlarmReminder[]>("/reminders");
          cachedReminders = fresh;
          lastFetch = Date.now();
        }

        // Get current HH:MM fresh every tick
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const today = now.toISOString().split("T")[0];

        for (const r of cachedReminders) {
          if (!r.isActive) continue;
          if (r.endDate && r.endDate.slice(0, 10) < today) continue;
          for (const t of r.times) {
            const key = `${r._id}_${t}`;
            if (t === hhmm && !wasFiredRecently(key)) {
              markFired(key);
              onAlarmRef.current(r, t);
              // Browser notification when tab is hidden
              if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("💊 Medicine Reminder", {
                  body: `Time to take ${r.medicineName}${r.dosage ? ` (${r.dosage})` : ""} at ${t}`,
                  icon: "/favicon.svg",
                });
              }
            }
          }
        }
      } catch { /* not logged in or network error */ }
    };

    // Immediate fetch on mount
    runCheck(true);

    // Check every 10 seconds — time comparison is cheap, API only called every 5 min
    const interval = setInterval(() => runCheck(false), 10_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    invalidate: () => { lastFetch = 0; cachedReminders = []; },
  };
}
