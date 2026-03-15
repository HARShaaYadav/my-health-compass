import { motion } from "framer-motion";
import { Bell, Plus, Clock, Check, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";

const exampleReminders = [
  { medicine: "Paracetamol 650mg", time: "8:00 AM, 8:00 PM", status: "active", daysLeft: 2 },
  { medicine: "Cetirizine 10mg", time: "10:00 PM", status: "active", daysLeft: 5 },
  { medicine: "Vitamin D3", time: "9:00 AM", status: "completed", daysLeft: 0 },
];

export default function RemindersPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Medicine Reminders</h1>
          <p className="ai-insight-text">Never miss a dose. Set up reminders from your prescriptions.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </motion.div>

      <div className="space-y-3">
        {exampleReminders.map((r, i) => (
          <motion.div
            key={r.medicine}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`clinical-card flex items-center gap-4 ${r.status === "completed" ? "opacity-60" : ""}`}
          >
            <div className={`p-3 rounded-xl ${r.status === "completed" ? "bg-success/10" : "bg-primary/10"}`}>
              {r.status === "completed" ? <Check className="h-5 w-5 text-success" /> : <Pill className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1">
              <h3 className="medical-heading text-base">{r.medicine}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3.5 w-3.5" />
                {r.time}
              </div>
            </div>
            <div className="text-right">
              {r.status === "completed" ? (
                <span className="text-xs text-success font-medium">Completed</span>
              ) : (
                <span className="text-xs text-muted-foreground">{r.daysLeft} days left</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="clinical-card text-center py-8">
        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Connect your account to receive push notifications for medicine reminders.</p>
      </div>
    </div>
  );
}
