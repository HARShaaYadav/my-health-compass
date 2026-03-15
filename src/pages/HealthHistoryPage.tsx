import { motion } from "framer-motion";
import { History, FileText, Stethoscope, Pill, Calendar } from "lucide-react";

const timeline = [
  { date: "Mar 2026", type: "report", title: "Blood Test — Annual Checkup", detail: "Hemoglobin: 13.2, Sugar: 92", icon: FileText },
  { date: "Feb 2026", type: "visit", title: "Dr. Patel — General Physician", detail: "Routine consultation, prescribed Vitamin D", icon: Stethoscope },
  { date: "Jan 2026", type: "prescription", title: "Prescription — Flu Treatment", detail: "Paracetamol, Cetirizine — 5 day course", icon: Pill },
  { date: "Dec 2025", type: "report", title: "Chest X-Ray", detail: "No abnormalities detected", icon: FileText },
];

export default function HealthHistoryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Health History</h1>
        <p className="ai-insight-text">Your personal health timeline — prescriptions, reports, and doctor visits in one place.</p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {timeline.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-4 relative"
              >
                <div className="z-10 p-2.5 rounded-xl bg-card border border-border shadow-sm">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="clinical-card flex-1 !py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  <h3 className="medical-heading text-sm">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="clinical-card text-center py-8">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Sign in to start building your personal health timeline.</p>
      </div>
    </div>
  );
}
