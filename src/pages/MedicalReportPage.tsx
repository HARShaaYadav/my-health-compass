import { motion } from "framer-motion";
import { ClipboardList, Upload, AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const exampleResults = [
  { name: "Hemoglobin", value: "9.5 g/dL", range: "12.0 - 17.5", status: "low" as const, explanation: "Your hemoglobin level is lower than normal. This may indicate anemia. You should consult a general physician." },
  { name: "Blood Sugar (Fasting)", value: "95 mg/dL", range: "70 - 100", status: "normal" as const, explanation: "Your fasting blood sugar is within the normal range. Maintain a balanced diet." },
  { name: "Cholesterol (LDL)", value: "165 mg/dL", range: "< 100", status: "high" as const, explanation: "Your LDL cholesterol is above the optimal range. Consider dietary changes and consult a cardiologist." },
];

const statusConfig = {
  low: { icon: TrendingDown, color: "text-warning", border: "border-l-warning", bg: "bg-warning/5" },
  normal: { icon: Minus, color: "text-success", border: "border-l-primary", bg: "bg-primary/5" },
  high: { icon: TrendingUp, color: "text-destructive", border: "border-l-destructive", bg: "bg-destructive/5" },
};

export default function MedicalReportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Medical Report Translator</h1>
        <p className="ai-insight-text">Upload your lab report and we'll explain every value in plain human language.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="medical-heading text-base mb-2">Upload Medical Report</h3>
          <p className="text-sm text-muted-foreground mb-4">PDF, JPG, or PNG — we'll extract and interpret your results.</p>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="medical-heading text-lg">Example Analysis</h2>
        {exampleResults.map((result, i) => {
          const config = statusConfig[result.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={result.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className={`clinical-card border-l-4 ${config.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="medical-heading text-base">{result.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="tabular-nums font-semibold text-sm">{result.value}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Reference range: {result.range}</p>
              <p className="ai-insight-text text-sm">{result.explanation}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          AI interpretation is for educational purposes only. Consult your doctor for proper diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}
