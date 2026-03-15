import { motion } from "framer-motion";
import { Shield, Upload, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const exampleClaims = [
  { item: "Blood Test Panel", amount: "$120", covered: true, reimbursement: "$96" },
  { item: "MRI Scan", amount: "$800", covered: true, reimbursement: "$640" },
  { item: "Dental Cleaning", amount: "$200", covered: false, reimbursement: "$0" },
];

export default function InsurancePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Insurance Help</h1>
        <p className="ai-insight-text">Upload your insurance documents and understand your coverage in plain language.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card">
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="medical-heading text-base mb-2">Upload Insurance Document</h3>
          <p className="text-sm text-muted-foreground mb-4">PDF or image of your insurance policy or claim.</p>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="medical-heading text-lg">Example Coverage Analysis</h2>
        {exampleClaims.map((claim, i) => (
          <motion.div
            key={claim.item}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            className={`clinical-card border-l-4 ${claim.covered ? "border-l-primary" : "border-l-destructive"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {claim.covered ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <h3 className="medical-heading text-sm">{claim.item}</h3>
                  <p className="text-xs text-muted-foreground">Billed: {claim.amount}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{claim.reimbursement}</p>
                <p className="text-xs text-muted-foreground">{claim.covered ? "Covered" : "Not covered"}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
