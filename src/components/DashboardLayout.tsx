import { ReactNode, useState, useCallback } from "react";
import AppSidebar from "./AppSidebar";
import AlarmModal from "./AlarmModal";
import { useReminderAlarm, AlarmReminder } from "@/hooks/useReminderAlarm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ActiveAlarm { reminder: AlarmReminder; time: string }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alarm, setAlarm] = useState<ActiveAlarm | null>(null);
  const [snoozeTimeout, setSnoozeTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleAlarm = useCallback((reminder: AlarmReminder, time: string) => {
    setAlarm({ reminder, time });
  }, []);

  const { invalidate } = useReminderAlarm(user ? handleAlarm : () => {});

  const handleTaken = () => {
    if (alarm) toast.success(`✅ ${alarm.reminder.medicineName} marked as taken`);
    setAlarm(null);
  };

  const handleSnooze = () => {
    if (!alarm) return;
    const snoozed = alarm;
    setAlarm(null);
    toast.info(`⏰ Snoozed for 5 minutes`);
    const t = setTimeout(() => setAlarm(snoozed), 5 * 60 * 1000);
    setSnoozeTimeout(t);
  };

  const handleDismiss = () => {
    if (snoozeTimeout) clearTimeout(snoozeTimeout);
    setAlarm(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppSidebar />
      <main className="flex flex-col flex-1 lg:ml-[280px] pt-14 lg:pt-0">
        <div className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </div>
        <footer className="safety-banner mt-auto">
          MedExplain AI provides information, not a diagnosis. Your doctor remains your primary source of medical truth.
        </footer>
      </main>

      <AlarmModal
        alarm={alarm}
        onTaken={handleTaken}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
