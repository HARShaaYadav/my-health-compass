import { motion } from "framer-motion";
import { AlertTriangle, Phone, MapPin, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const emergencySigns = [
  "Severe chest pain or pressure",
  "Difficulty breathing or shortness of breath",
  "Sudden weakness or numbness on one side",
  "Severe allergic reaction (swelling, difficulty swallowing)",
  "Uncontrolled bleeding",
  "Loss of consciousness",
  "Severe head injury",
  "Sudden vision loss",
];

export default function EmergencyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="clinical-card-danger">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            <h1 className="medical-heading text-2xl sm:text-3xl text-destructive">Emergency Help</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            If you or someone is experiencing a medical emergency, call emergency services immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => window.open("tel:911")}
            >
              <Phone className="h-5 w-5" />
              Call 911
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <MapPin className="h-5 w-5" />
              Find Nearest Hospital
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="medical-heading text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-destructive" />
          Warning Signs — Seek Immediate Help
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencySigns.map((sign, i) => (
            <motion.div
              key={sign}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10"
            >
              <Heart className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-sm">{sign}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Important: </span>
          This page is for guidance only. In a real emergency, always call your local emergency number (911 in the US) or go to the nearest emergency room.
        </p>
      </div>
    </div>
  );
}
