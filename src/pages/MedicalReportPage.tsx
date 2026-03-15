import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Upload, AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase.functions.invoke("analyze-report", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);

      if (user) {
        await supabase.from("medical_reports").insert({
          user_id: user.id,
          report_type: data.report_type,
          results: data.results,
          ai_summary: data.summary,
        });
        await supabase.from("health_entries").insert({
          user_id: user.id,
          entry_type: "report",
          title: `${data.report_type} Report Analysis`,
          detail: data.summary?.slice(0, 200),
        });
        toast.success("Report analyzed and saved!");
      }
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Medical Report Translator</h1>
        <p className="ai-insight-text">Upload your lab report and we'll explain every value in plain human language.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
        >
          {analyzing ? (
            <div className="space-y-4">
              <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Analyzing report data...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="medical-heading text-base mb-2">Upload Medical Report</h3>
              <p className="text-sm text-muted-foreground mb-4">PDF, JPG, or PNG — we'll extract and interpret your results.</p>
              <label>
                <input type="file" accept="image/*,application/pdf" onChange={onFileSelect} className="hidden" />
                <Button variant="outline" className="gap-2" asChild>
                  <span><Upload className="h-4 w-4" />Browse Files</span>
                </Button>
              </label>
            </>
          )}
        </div>
      </motion.div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="medical-heading text-lg">{analysis.report_type} — Analysis</h2>
          {analysis.results.map((result, i) => {
            const config = statusConfig[result.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={result.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`clinical-card border-l-4 ${config.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="medical-heading text-base">{result.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="tabular-nums font-semibold text-sm">{result.value}{result.unit ? ` ${result.unit}` : ""}</span>
                  </div>
                </div>
                {result.reference_range && (
                  <p className="text-xs text-muted-foreground mb-2">Reference range: {result.reference_range}</p>
                )}
                <p className="ai-insight-text text-sm">{result.explanation}</p>
              </motion.div>
            );
          })}

          {analysis.summary && (
            <div className="clinical-card-info">
              <h3 className="medical-heading text-sm mb-2">AI Summary</h3>
              <p className="ai-insight-text text-sm">{analysis.summary}</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          AI interpretation is for educational purposes only. Consult your doctor for proper diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}
