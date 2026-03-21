import { useState } from "react";
import { motion } from "framer-motion";
import { History, FileText, Stethoscope, Pill, Calendar, MessageCircle, StickyNote, Trash2, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const iconMap: Record<string, any> = {
  report: FileText, visit: Stethoscope, prescription: Pill, symptom: MessageCircle, note: StickyNote,
};

const entryTypes = [
  { value: "visit", label: "Doctor Visit" },
  { value: "note", label: "Health Note" },
  { value: "prescription", label: "Prescription" },
  { value: "symptom", label: "Symptom" },
  { value: "report", label: "Lab Report" },
];

interface HealthEntry {
  _id: string;
  entryType: string;
  title: string;
  detail: string | null;
  entryDate: string;
  createdAt: string;
}

export default function HealthHistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newType, setNewType] = useState("note");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["health-entries", user?.id],
    queryFn: () => api.get<HealthEntry[]>("/health-entries"),
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: () => api.post("/health-entries", { entryType: newType, title: newTitle, detail: newDetail || null, entryDate: newDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-entries"] });
      queryClient.invalidateQueries({ queryKey: ["entry-count"] });
      setShowForm(false); setNewTitle(""); setNewDetail(""); setNewType("note"); setNewDate(new Date().toISOString().split("T")[0]);
      toast.success("Entry added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/health-entries/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["health-entries"] }); toast.success("Entry removed"); },
  });

  const grouped = entries.reduce<Record<string, HealthEntry[]>>((acc, entry) => {
    const date = new Date(entry.entryDate);
    const key = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Health History</h1>
          <p className="ai-insight-text">Your personal health timeline — prescriptions, reports, and checkups in one place.</p>
        </div>
        <Button className="gap-2 shrink-0 self-start" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Entry"}
        </Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="clinical-card space-y-4">
          <div className="flex flex-wrap gap-2">
            {entryTypes.map((t) => (
              <button key={t.value} onClick={() => setNewType(t.value)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${newType === t.value ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/30"}`}>{t.label}</button>
            ))}
          </div>
          <Input placeholder="Title *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Textarea placeholder="Details (optional)" value={newDetail} onChange={(e) => setNewDetail(e.target.value)} rows={3} />
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Button onClick={() => addMutation.mutate()} disabled={!newTitle.trim() || addMutation.isPending} className="w-full">
            {addMutation.isPending ? "Adding..." : "Add Entry"}
          </Button>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="clinical-card text-center py-8"><History className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No health history yet. Your timeline will build as you use MedExplain AI.</p></div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h2 className="medical-heading text-sm text-muted-foreground mb-4 uppercase tracking-wider">{month}</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {items.map((item, i) => {
                  const Icon = iconMap[item.entryType] || FileText;
                  return (
                    <motion.div key={item._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-4 relative group">
                      <div className="z-10 p-2.5 rounded-xl bg-card border border-border shadow-sm"><Icon className="h-4 w-4 text-primary" /></div>
                      <div className="clinical-card flex-1 !py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 mb-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{new Date(item.entryDate).toLocaleDateString()}</span></div>
                          <button onClick={() => deleteMutation.mutate(item._id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <h3 className="medical-heading text-sm">{item.title}</h3>
                        {item.detail && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.detail}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
