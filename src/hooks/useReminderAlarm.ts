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
  // Keep onAlarm in a ref so the interval always calls the latest version
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const runCheck = async (forceFetch = false) => {
      try {
        if (forceFetch || Date.now() - lastFetch > FETCH_INTERVAL) {
          cachedReminders = await api.get<AlarmReminder[]>("/reminders");
          lastFetch = Date.now();
        }

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
              if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("💊 Medicine Reminder", {
                  body: `Time to take ${r.medicineName}${r.dosage ? ` (${r.dosage})` : ""} at ${t}`,
                  icon: "/favicon.svg",
                });
              }
            }
          }
        }
      } catch { /* not logged in */ }
    };

    // Fresh fetch immediately on mount
    runCheck(true);
    // Then every 30s — uses cache, only hits API every 5 min
    const interval = setInterval(() => runCheck(false), 30_000);
    return () => clearInterval(interval);
  }, []); // empty deps — interval is set once, onAlarm always fresh via ref

  return {
    invalidate: () => { lastFetch = 0; cachedReminders = []; },
  };
}
