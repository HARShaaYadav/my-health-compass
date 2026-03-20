import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Clock, Check, Pill, Trash2, X, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Reminder {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string;
  times: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface Interaction {
  drug1: string;
  drug2: string;
  severity: "low" | "moderate" | "severe";
  description: string;
  recommendation: string;
}

const severityStyles = {
  low: "border-l-warning bg-warning/5",
  moderate: "border-l-warning bg-warning/5",
  severe: "border-l-destructive bg-destructive/5",
};

export default function RemindersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState("08:00");
  const [endDate, setEndDate] = useState("");
  const [interactions, setInteractions] = useState<Interaction[] | null>(null);
  const [interactionSummary, setInteractionSummary] = useState("");
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_reminders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user,
  });

  const activeReminders = reminders.filter(r => r.is_active);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medicine_reminders").insert({
        user_id: user!.id,
        medicine_name: name,
        dosage: dosage || null,
        times: times.split(",").map(t => t.trim()),
        end_date: endDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setShowForm(false);
      setName("");
      setDosage("");
      setTimes("08:00");
      setEndDate("");
      setInteractions(null);
      toast.success("Reminder added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("medicine_reminders").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setInteractions(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicine_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setInteractions(null);
      toast.success("Reminder deleted");
    },
  });

  const checkInteractions = async () => {
    if (activeReminders.length < 2) {
      toast.info("Need at least 2 active medicines to check interactions.");
      return;
    }
    setCheckingInteractions(true);
    setInteractions(null);
    try {
      const medicines = activeReminders.map(r => `${r.medicine_name}${r.dosage ? ` (${r.dosage})` : ""}`);
      const { data, error } = await supabase.functions.invoke("check-interactions", {
        body: { medicines },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setInteractions(data.interactions || []);
      setInteractionSummary(data.summary || "");
    } catch (e: any) {
      toast.error(e.message || "Interaction check failed");
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Medicine Reminders</h1>
          <p className="ai-insight-text">Never miss a dose. Set up reminders from your prescriptions.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Medicine"}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="clinical-card space-y-4">
          <Input placeholder="Medicine name *" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Dosage (e.g., 500mg)" value={dosage} onChange={e => setDosage(e.target.value)} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Times (comma-separated)</label>
            <Input placeholder="08:00, 20:00" value={times} onChange={e => setTimes(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End date (optional)</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!name.trim() || addMutation.isPending} className="w-full">
            {addMutation.isPending ? "Adding..." : "Add Reminder"}
          </Button>
        </motion.div>
      )}

      {/* Interaction Check */}
      {activeReminders.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="outline" className="w-full gap-2" onClick={checkInteractions} disabled={checkingInteractions}>
            {checkingInteractions ? (
              <>
                <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Checking interactions...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Check Drug Interactions ({activeReminders.length} medicines)
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Interaction Results */}
      {interactions !== null && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {interactions.length === 0 ? (
            <div className="clinical-card-normal flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">No known interactions found</p>
                <p className="text-xs text-muted-foreground">{interactionSummary}</p>
              </div>
            </div>
          ) : (
            <>
              <h3 className="medical-heading text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Potential Interactions Found
              </h3>
              {interactions.map((ix, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`clinical-card border-l-4 ${severityStyles[ix.severity]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{ix.drug1} + {ix.drug2}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ix.severity === "severe" ? "bg-destructive/10 text-destructive" :
                      ix.severity === "moderate" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {ix.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{ix.description}</p>
                  <p className="text-xs text-foreground font-medium">→ {ix.recommendation}</p>
                </motion.div>
              ))}
              {interactionSummary && (
                <p className="ai-insight-text text-sm">{interactionSummary}</p>
              )}
              <div className="clinical-card-warning flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This is AI-generated guidance. Always consult your pharmacist or doctor about drug interactions.
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="clinical-card text-center py-8">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reminders yet. Add your first medicine reminder above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`clinical-card flex items-center gap-4 ${!r.is_active ? "opacity-60" : ""}`}
            >
              <button
                onClick={() => toggleMutation.mutate({ id: r.id, is_active: !r.is_active })}
                className={`p-3 rounded-xl transition-colors ${r.is_active ? "bg-primary/10" : "bg-success/10"}`}
              >
                {r.is_active ? <Pill className="h-5 w-5 text-primary" /> : <Check className="h-5 w-5 text-success" />}
              </button>
              <div className="flex-1">
                <h3 className="medical-heading text-base">{r.medicine_name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {r.times.join(", ")}
                  {r.dosage && <span>· {r.dosage}</span>}
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(r.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
