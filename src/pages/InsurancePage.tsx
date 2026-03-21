import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Upload, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CoverageItem {
  item: string;
  covered: boolean;
  coverage_percentage?: number;
  max_amount?: string;
  notes?: string;
}

interface InsuranceAnalysis {
  plan_name?: string;
  provider?: string;
  coverage_items: CoverageItem[];
  deductible?: string;
  out_of_pocket_max?: string;
  summary: string;
  exclusions?: string[];
  recommendations?: string[];
}

export default function InsurancePage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<InsuranceAnalysis | null>(null);

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
      const data = await api.post<InsuranceAnalysis>("/ai/analyze-insurance", { imageBase64: base64, mimeType: file.type });
      setAnalysis(data);
      toast.success("Insurance document analyzed!");
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Insurance Help</h1>
        <p className="ai-insight-text">Upload your insurance document and we'll explain your coverage in plain language.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="border-2 border-dashed border-border rounded-2xl p-6 sm:p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
          {analyzing ? (
            <div className="space-y-4"><div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /><p className="text-sm text-muted-foreground">Analyzing document...</p></div>
          ) : analysis ? (
            <div className="flex items-center gap-2 text-primary justify-center"><Shield className="h-6 w-6" /><span className="font-medium">Document analyzed successfully</span></div>
          ) : (
            <>
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="medical-heading text-base mb-2">Upload Insurance Document</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload. Supports JPG, PNG, PDF.</p>
              <label className="cursor-pointer">
                <input type="file" accept="image/*,application/pdf" onChange={onFileSelect} className="hidden" />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors"><Upload className="h-4 w-4" />Browse Files</span>
              </label>
            </>
          )}
        </div>
      </motion.div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {(analysis.plan_name || analysis.provider) && (
            <div className="clinical-card-info">
              {analysis.plan_name && <h2 className="medical-heading text-lg">{analysis.plan_name}</h2>}
              {analysis.provider && <p className="text-sm text-muted-foreground">{analysis.provider}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                {analysis.deductible && <div><span className="text-muted-foreground">Deductible: </span><span className="font-medium">{analysis.deductible}</span></div>}
                {analysis.out_of_pocket_max && <div><span className="text-muted-foreground">Out-of-pocket max: </span><span className="font-medium">{analysis.out_of_pocket_max}</span></div>}
              </div>
            </div>
          )}

          <h3 className="medical-heading text-base">Coverage Details</h3>
          {analysis.coverage_items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="clinical-card flex items-start gap-3">
              {item.covered ? <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.item}</p>
                {item.covered && item.coverage_percentage && <p className="text-xs text-muted-foreground">Coverage: {item.coverage_percentage}%{item.max_amount ? ` (up to ${item.max_amount})` : ""}</p>}
                {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
              </div>
            </motion.div>
          ))}

          {analysis.summary && (
            <div className="clinical-card-info"><h3 className="medical-heading text-sm mb-2">Summary</h3><p className="ai-insight-text text-sm">{analysis.summary}</p></div>
          )}

          {analysis.exclusions && analysis.exclusions.length > 0 && (
            <div className="clinical-card-warning">
              <h3 className="medical-heading text-sm mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-warning" />Key Exclusions</h3>
              <ul className="space-y-1">{analysis.exclusions.map((ex, i) => <li key={i} className="text-sm text-muted-foreground">• {ex}</li>)}</ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
