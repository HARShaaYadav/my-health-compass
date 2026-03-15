import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Plus, X, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const commonSymptoms = ["Fever", "Headache", "Cough", "Fatigue", "Nausea", "Body Pain", "Sore Throat", "Dizziness", "Chest Pain", "Shortness of Breath"];

interface AnalysisResult {
  condition: string;
  severity: "low" | "medium" | "high";
  specialist: string;
  description: string;
}

const mockAnalyze = (symptoms: string[]): AnalysisResult[] => {
  const lower = symptoms.map(s => s.toLowerCase());
  const results: AnalysisResult[] = [];

  if (lower.includes("chest pain") || lower.includes("shortness of breath")) {
    results.push({ condition: "Possible Cardiac Event", severity: "high", specialist: "Cardiologist / Emergency", description: "Chest pain combined with breathing difficulty requires immediate medical attention." });
  }
  if (lower.includes("fever") && lower.includes("headache")) {
    results.push({ condition: "Viral Fever", severity: "medium", specialist: "General Physician", description: "Fever with headache is commonly associated with viral infections. Rest and hydration are recommended." });
  }
  if (lower.includes("cough") && lower.includes("sore throat")) {
    results.push({ condition: "Upper Respiratory Infection", severity: "low", specialist: "ENT Specialist", description: "Common cold symptoms that typically resolve within 7-10 days." });
  }
  if (results.length === 0) {
    results.push({ condition: "General Health Concern", severity: "low", specialist: "General Physician", description: "Based on the symptoms provided, a general consultation is recommended for proper evaluation." });
  }
  return results;
};

const severityColors = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const analyze = () => {
    if (symptoms.length === 0) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResults(mockAnalyze(symptoms));
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Symptom Checker</h1>
        <p className="ai-insight-text">Describe your symptoms and our AI will suggest possible conditions and specialists.</p>
      </motion.div>

      {/* Input */}
      <div className="clinical-card space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a symptom..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSymptom(input)}
            className="flex-1"
          />
          <Button onClick={() => addSymptom(input)} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map(s => (
            <button
              key={s}
              onClick={() => addSymptom(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                symptoms.includes(s)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {symptoms.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button onClick={() => removeSymptom(s)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
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
            <span className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Analyze Symptoms
            </span>
          )}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <h2 className="medical-heading text-lg">Analysis Results</h2>
            {results.map((r, i) => (
              <motion.div
                key={r.condition}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`clinical-card border-l-4 ${
                  r.severity === "high" ? "border-l-destructive" : r.severity === "medium" ? "border-l-warning" : "border-l-primary"
                }`}
              >
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
