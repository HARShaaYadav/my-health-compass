import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Plus, X, AlertCircle, ChevronRight, Camera, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const commonSymptoms = ["Fever", "Headache", "Cough", "Fatigue", "Nausea", "Body Pain", "Sore Throat", "Dizziness", "Chest Pain", "Shortness of Breath"];

interface AnalysisResult {
  condition: string;
  severity: "low" | "medium" | "high";
  specialist: string;
  description: string;
}

interface ImageAnalysis {
  results: AnalysisResult[];
  observations: string;
  immediate_actions?: string[];
  urgency: string;
}

const severityColors = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function SymptomCheckerPage() {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setResults(null);
    }
    setInput("");
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
    setResults(null);
  };

  const analyze = async () => {
    if (symptoms.length === 0) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-symptoms", { body: { symptoms } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      if (user) {
        await supabase.from("symptom_checks").insert({ user_id: user.id, symptoms, results: data.results || [] });
        await supabase.from("health_entries").insert({
          user_id: user.id, entry_type: "symptom",
          title: `Symptom Check: ${symptoms.slice(0, 3).join(", ")}`,
          detail: (data.results || []).map((r: AnalysisResult) => r.condition).join(", "),
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setAnalyzingImage(true);
    setImageAnalysis(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageBase64: base64, mimeType: file.type },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setImageAnalysis(data);

      if (user) {
        await supabase.from("health_entries").insert({
          user_id: user.id, entry_type: "symptom",
          title: `Image Analysis: ${(data.results || []).map((r: AnalysisResult) => r.condition).join(", ") || "Visual Check"}`,
          detail: data.observations?.slice(0, 200),
        });
      }
      toast.success("Image analyzed!");
    } catch (e: any) {
      toast.error(e.message || "Image analysis failed");
    } finally {
      setAnalyzingImage(false);
    }
  }, [user]);

  const onImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const allResults = [
    ...(results || []),
    ...(imageAnalysis?.results || []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Symptom Checker</h1>
        <p className="ai-insight-text">Describe your symptoms or upload an image for AI-powered analysis.</p>
      </motion.div>

      {/* Text-based symptoms */}
      <div className="clinical-card space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />Describe Symptoms</h3>
        <div className="flex gap-2">
          <Input placeholder="Type a symptom..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSymptom(input)} className="flex-1" />
          <Button onClick={() => addSymptom(input)} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map(s => (
            <button key={s} onClick={() => addSymptom(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${symptoms.includes(s) ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
              {s}
            </button>
          ))}
        </div>
        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {symptoms.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button onClick={() => removeSymptom(s)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <Button onClick={analyze} disabled={symptoms.length === 0 || analyzing} className="w-full">
          {analyzing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing symptoms...
            </span>
          ) : (
            <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4" />Analyze Symptoms</span>
          )}
        </Button>
      </div>

      {/* Image-based detection */}
      <div className="clinical-card space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4 text-accent" />Visual Symptom Analysis</h3>
        <p className="text-xs text-muted-foreground">Upload a photo of skin conditions, rashes, eye infections, or swelling for AI analysis.</p>

        {analyzingImage ? (
          <div className="text-center py-6">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing image...</p>
          </div>
        ) : imagePreview && imageAnalysis ? (
          <div className="flex items-center gap-3">
            <img src={imagePreview} alt="Uploaded" className="h-16 w-16 rounded-xl object-cover border border-border" />
            <div>
              <p className="text-sm font-medium text-primary">Image analyzed</p>
              <p className="text-xs text-muted-foreground">{imageAnalysis.observations?.slice(0, 80)}...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <label className="cursor-pointer flex-1">
              <input type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
              <span className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                <Upload className="h-4 w-4" />Upload Image
              </span>
            </label>
            <label className="cursor-pointer flex-1">
              <input type="file" accept="image/*" capture="environment" onChange={onImageSelect} className="hidden" />
              <span className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                <Camera className="h-4 w-4" />Take Photo
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Image immediate actions */}
      {imageAnalysis?.immediate_actions && imageAnalysis.immediate_actions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="clinical-card-info">
          <h3 className="medical-heading text-sm mb-2">Suggested Immediate Actions</h3>
          <ul className="space-y-1.5">
            {imageAnalysis.immediate_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />{action}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {allResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <h2 className="medical-heading text-lg">Analysis Results</h2>
            {allResults.map((r, i) => (
              <motion.div key={`${r.condition}-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`clinical-card border-l-4 ${r.severity === "high" ? "border-l-destructive" : r.severity === "medium" ? "border-l-warning" : "border-l-primary"}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="medical-heading text-base">{r.condition}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${severityColors[r.severity]}`}>
                    {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)} Severity
                  </span>
                </div>
                <p className="ai-insight-text text-sm mb-3">{r.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Recommended:</span>
                  <span className="font-medium text-foreground">{r.specialist}</span>
                </div>
              </motion.div>
            ))}
            <div className="clinical-card-warning flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Disclaimer: </span>
                This is an AI-based suggestion and is not a medical diagnosis. Please consult a licensed doctor for proper evaluation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
