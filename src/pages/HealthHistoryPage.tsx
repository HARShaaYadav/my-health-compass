import { motion } from "framer-motion";
import { History, FileText, Stethoscope, Pill, Calendar, MessageCircle, StickyNote, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  report: FileText,
  visit: Stethoscope,
  prescription: Pill,
  symptom: MessageCircle,
  note: StickyNote,
};

export default function HealthHistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["health-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-entries"] });
      toast.success("Entry removed");
    },
  });

  // Group by month
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const date = new Date(entry.entry_date);
    const key = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Health History</h1>
        <p className="ai-insight-text">Your personal health timeline — prescriptions, reports, and checkups in one place.</p>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <div className="clinical-card text-center py-8">
          <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No health history yet. Your timeline will build as you use MedExplain AI.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h2 className="medical-heading text-sm text-muted-foreground mb-4 uppercase tracking-wider">{month}</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {items.map((item, i) => {
                  const Icon = iconMap[item.entry_type] || FileText;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-4 relative group"
                    >
                      <div className="z-10 p-2.5 rounded-xl bg-card border border-border shadow-sm">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="clinical-card flex-1 !py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.entry_date).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
