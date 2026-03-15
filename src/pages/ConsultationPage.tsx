import { motion } from "framer-motion";
import { Video, Search, Star, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const doctors = [
  { name: "Dr. Sarah Chen", specialty: "General Physician", rating: 4.8, available: "Today, 3:00 PM", fee: "$30" },
  { name: "Dr. Raj Patel", specialty: "Cardiologist", rating: 4.9, available: "Tomorrow, 10:00 AM", fee: "$50" },
  { name: "Dr. Emily Rodriguez", specialty: "Dermatologist", rating: 4.7, available: "Today, 5:30 PM", fee: "$45" },
  { name: "Dr. James Kim", specialty: "ENT Specialist", rating: 4.6, available: "Mar 18, 11:00 AM", fee: "$40" },
];

export default function ConsultationPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Online Consultation</h1>
        <p className="ai-insight-text">Book video consultations with verified specialists.</p>
      </motion.div>

      <div className="clinical-card !p-3">
        <div className="flex gap-2">
          <Search className="h-5 w-5 text-muted-foreground mt-2.5 ml-2" />
          <Input placeholder="Search by specialty, doctor name..." className="border-0 shadow-none focus-visible:ring-0" />
        </div>
      </div>

      <div className="space-y-3">
        {doctors.map((doc, i) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="clinical-card flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {doc.name.split(" ").slice(1).map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="medical-heading text-base">{doc.name}</h3>
              <p className="text-sm text-muted-foreground">{doc.specialty}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{doc.rating}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.available}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums mb-2">{doc.fee}</p>
              <Button size="sm" className="gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Book
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
