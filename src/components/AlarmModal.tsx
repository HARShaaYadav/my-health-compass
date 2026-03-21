import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Clock, Check, BellOff, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AlarmReminder } from "@/hooks/useReminderAlarm";

interface Props {
  alarm: { reminder: AlarmReminder; time: string } | null;
  onTaken: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

// Generate a simple beep tone via Web Audio API (no external file needed)
function createAlarmSound(): { start: () => void; stop: () => void } {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;

  const beep = () => {
    if (!ctx) return;
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  };

  return {
    start() {
      try {
        ctx = new AudioContext();
        beep();
        interval = setInterval(beep, 1200);
      } catch { /* audio not supported */ }
    },
    stop() {
      if (interval) clearInterval(interval);
      try { ctx?.close(); } catch { /* ignore */ }
      ctx = null;
    },
  };
}

export default function AlarmModal({ alarm, onTaken, onSnooze, onDismiss }: Props) {
  const soundRef = useRef<ReturnType<typeof createAlarmSound> | null>(null);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (alarm) {
      soundRef.current = createAlarmSound();
      soundRef.current.start();
      setRinging(true);
    } else {
      soundRef.current?.stop();
      soundRef.current = null;
      setRinging(false);
    }
    return () => { soundRef.current?.stop(); };
  }, [alarm]);

  const stopAndCall = (fn: () => void) => {
    soundRef.current?.stop();
    setRinging(false);
    fn();
  };

  return (
    <AnimatePresence>
      {alarm && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              {/* Pulsing header */}
              <div className="relative bg-primary/10 px-6 pt-8 pb-6 text-center">
                <motion.div
                  animate={ringing ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4"
                >
                  <AlarmClock className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">Medicine Reminder</p>
                <h2 className="medical-heading text-2xl">{alarm.reminder.medicineName}</h2>
                {alarm.reminder.dosage && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                    <Pill className="h-3.5 w-3.5" />{alarm.reminder.dosage}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />{alarm.time}
                </p>
              </div>

              {/* Actions */}
              <div className="p-5 space-y-3">
                <Button
                  className="w-full gap-2 h-11"
                  onClick={() => stopAndCall(onTaken)}
                >
                  <Check className="h-4 w-4" />
                  Taken
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 h-10"
                    onClick={() => stopAndCall(onSnooze)}
                  >
                    <AlarmClock className="h-4 w-4" />
                    Snooze 5 min
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 h-10 text-muted-foreground"
                    onClick={() => stopAndCall(onDismiss)}
                  >
                    <BellOff className="h-4 w-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
