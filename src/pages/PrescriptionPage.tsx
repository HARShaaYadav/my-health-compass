import { motion } from "framer-motion";
import { FileText, Upload, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrescriptionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Scan Prescription</h1>
        <p className="ai-insight-text">Upload a photo of your doctor's prescription and we'll decode it into readable text.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clinical-card"
      >
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="medical-heading text-base mb-2">Upload Prescription Image</h3>
          <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload. Supports JPG, PNG, PDF.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Browse Files
            </Button>
            <Button variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Example Result */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
        <h2 className="medical-heading text-lg">How It Works</h2>
        <div className="clinical-card-normal">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Example Output</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-secondary">
              <p className="font-medium">Paracetamol 650 mg</p>
              <p className="text-muted-foreground">Twice a day for 3 days — Fever and pain relief</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary">
              <p className="font-medium">Cetirizine 10 mg</p>
              <p className="text-muted-foreground">Once daily at bedtime — Allergy relief</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          AI-based handwriting recognition may not be 100% accurate. Always verify with your pharmacist.
        </p>
      </div>
    </div>
  );
}
