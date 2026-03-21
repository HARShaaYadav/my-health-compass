import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Upload, AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReportResult {
  name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  status: "normal" | "low" | "high";
  explanation: string;
}

interface ReportAnalysis {
  report_type: string;
  results: ReportResult[];
  summary: string;
}

const statusConfig = {
  low: { icon: TrendingDown, color: "text-warning", border: "border-l-warning" },
  normal: { icon: Minus, color: "text-success", border: "border-l-primary" },
  high: { icon: TrendingUp, color: "text-destructive", border: "border-l-destructive" },
};

export default function MedicalReportPage() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await api.post<ReportAnalysis>("/ai/analyze-report", { imageBase64: base64, mimeType: file.type });
      setAnalysis(data);

      if (user) {
        await api.post("/reports", { reportType: data.report_type, results: data.results, aiSummary: data.summary });
        await api.post("/health-entries", { entryType: "report", title: `Report: ${data.report_type}`, detail: data.summary?.slice(0, 200) });
        toast.success("Report analyzed and saved!");
      }
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Translate Medical Report</h1>
        <p className="ai-insight-text">Upload your lab report and we'll explain each result in plain language.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="border-2 border-dashed border-border rounded-2xl p-6 sm:p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
          {analyzing ? (
            <div className="space-y-4">
              <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Analyzing report...</p>
            </div>
          ) : analysis ? (
            <div className="flex items-center gap-2 text-primary justify-center">
              <ClipboardList className="h-6 w-6" /><span className="font-medium">Report analyzed successfully</span>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="medical-heading text-base mb-2">Upload Medical Report</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload. Supports JPG, PNG, PDF.</p>
              <label className="cursor-pointer">
                <input type="file" accept="image/*,application/pdf" onChange={onFileSelect} className="hidden" />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  <Upload className="h-4 w-4" />Browse Files
                </span>
              </label>
            </>
          )}
        </div>
      </motion.div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="medical-heading text-lg">{analysis.report_type}</h2>
          {analysis.results.map((r, i) => {
            const cfg = statusConfig[r.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`clinical-card border-l-4 ${cfg.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="medical-heading text-base">{r.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{r.value}{r.unit && ` ${r.unit}`}</span>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                </div>
                {r.reference_range && <p className="text-xs text-muted-foreground mb-2">Normal: {r.reference_range}</p>}
                <p className="ai-insight-text text-sm">{r.explanation}</p>
              </motion.div>
            );
          })}
          {analysis.summary && (
            <div className="clinical-card-info">
              <h3 className="medical-heading text-sm mb-2">Summary</h3>
              <p className="ai-insight-text text-sm">{analysis.summary}</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">AI analysis is for informational purposes only. Always consult your doctor to interpret your results.</p>
      </div>
    </div>
  );
}
