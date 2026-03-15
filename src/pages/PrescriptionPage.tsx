import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Camera, AlertCircle, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  purpose?: string;
}

interface PrescriptionResult {
  extracted_text: string;
  medicines: Medicine[];
}

export default function PrescriptionPage() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setResult(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-prescription", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);

      // Save to DB
      if (user) {
        await supabase.from("prescriptions").insert({
          user_id: user.id,
          extracted_text: data.extracted_text,
          medicines: data.medicines,
        });
        await supabase.from("health_entries").insert({
          user_id: user.id,
          entry_type: "prescription",
          title: `Prescription: ${(data.medicines || []).map((m: Medicine) => m.name).join(", ") || "Scanned"}`,
          detail: data.extracted_text?.slice(0, 200),
        });
        toast.success("Prescription analyzed and saved!");
      }
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Scan Prescription</h1>
        <p className="ai-insight-text">Upload a photo of your doctor's prescription and we'll decode it into readable text.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
        >
          {analyzing ? (
            <div className="space-y-4">
              <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Reading prescription data...</p>
            </div>
          ) : preview && result ? (
            <div className="flex items-center gap-2 text-primary">
              <FileText className="h-6 w-6" />
              <span className="font-medium">Prescription analyzed successfully</span>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="medical-heading text-base mb-2">Upload Prescription Image</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload. Supports JPG, PNG, PDF.</p>
              <div className="flex justify-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*,application/pdf" onChange={onFileSelect} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    <Upload className="h-4 w-4" />Browse Files
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={onFileSelect} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    <Camera className="h-4 w-4" />Take Photo
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="medical-heading text-lg">Extracted Medicines</h2>
          {result.medicines.map((med, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="clinical-card-normal"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-5 w-5 text-primary" />
                <h3 className="medical-heading text-base">{med.name}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="p-2 rounded-lg bg-secondary">
                  <span className="text-muted-foreground">Dosage: </span>
                  <span className="font-medium">{med.dosage}</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary">
                  <span className="text-muted-foreground">Frequency: </span>
                  <span className="font-medium">{med.frequency}</span>
                </div>
                {med.duration && (
                  <div className="p-2 rounded-lg bg-secondary">
                    <span className="text-muted-foreground">Duration: </span>
                    <span className="font-medium">{med.duration}</span>
                  </div>
                )}
              </div>
              {med.purpose && (
                <p className="ai-insight-text text-sm mt-2">{med.purpose}</p>
              )}
            </motion.div>
          ))}

          {result.extracted_text && (
            <div className="clinical-card">
              <h3 className="medical-heading text-sm mb-2">Raw Extracted Text</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.extracted_text}</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          AI-based handwriting recognition may not be 100% accurate. Always verify with your pharmacist.
        </p>
      </div>
    </div>
  );
}
