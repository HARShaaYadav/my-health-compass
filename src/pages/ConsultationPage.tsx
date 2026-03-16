import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Search, Star, Calendar, Clock, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const doctors = [
  { name: "Dr. Sarah Chen", specialty: "General Physician", rating: 4.8, slots: ["Today, 3:00 PM", "Today, 5:00 PM", "Tomorrow, 10:00 AM"], fee: "$30" },
  { name: "Dr. Raj Patel", specialty: "Cardiologist", rating: 4.9, slots: ["Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM", "Mar 20, 9:00 AM"], fee: "$50" },
  { name: "Dr. Emily Rodriguez", specialty: "Dermatologist", rating: 4.7, slots: ["Today, 5:30 PM", "Mar 19, 11:00 AM", "Mar 20, 3:00 PM"], fee: "$45" },
  { name: "Dr. James Kim", specialty: "ENT Specialist", rating: 4.6, slots: ["Mar 18, 11:00 AM", "Mar 19, 2:00 PM", "Mar 20, 10:00 AM"], fee: "$40" },
  { name: "Dr. Lisa Wang", specialty: "Neurologist", rating: 4.8, slots: ["Mar 19, 9:00 AM", "Mar 20, 1:00 PM"], fee: "$55" },
  { name: "Dr. Ahmed Hassan", specialty: "Orthopedic Surgeon", rating: 4.7, slots: ["Tomorrow, 11:00 AM", "Mar 20, 4:00 PM"], fee: "$60" },
];

export default function ConsultationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<typeof doctors[0] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const { data: bookings = [] } = useQuery({
    queryKey: ["consultations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultations").select("*").order("appointment_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!bookingDoctor || !selectedSlot || !user) return;
      const { error } = await supabase.from("consultations").insert({
        user_id: user.id,
        doctor_name: bookingDoctor.name,
        specialty: bookingDoctor.specialty,
        appointment_time: new Date().toISOString(),
        fee: bookingDoctor.fee,
        notes: `Slot: ${selectedSlot}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      toast.success(`Appointment booked with ${bookingDoctor?.name}!`);
      setBookingDoctor(null);
      setSelectedSlot(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consultations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      toast.success("Appointment cancelled");
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Online Consultation</h1>
        <p className="ai-insight-text">Book video consultations with verified specialists.</p>
      </motion.div>

      {/* Upcoming bookings */}
      {bookings.filter(b => b.status === "booked").length > 0 && (
        <div className="space-y-3">
          <h2 className="medical-heading text-lg">Your Appointments</h2>
          {bookings.filter(b => b.status === "booked").map((b: any) => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="clinical-card-info flex items-center justify-between">
              <div>
                <h3 className="medical-heading text-sm">{b.doctor_name}</h3>
                <p className="text-xs text-muted-foreground">{b.specialty} · {b.notes?.replace("Slot: ", "")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-full">Booked</span>
                <button onClick={() => cancelMutation.mutate(b.id)} className="text-xs text-muted-foreground hover:text-destructive">Cancel</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="clinical-card !p-3">
        <div className="flex gap-2">
          <Search className="h-5 w-5 text-muted-foreground mt-2.5 ml-2" />
          <Input
            placeholder="Search by specialty, doctor name..."
            className="border-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredDoctors.map((doc, i) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="clinical-card"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                {doc.name.split(" ").slice(1).map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="medical-heading text-base">{doc.name}</h3>
                <p className="text-sm text-muted-foreground">{doc.specialty}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{doc.rating}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.slots[0]}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums mb-2">{doc.fee}</p>
                <Button size="sm" className="gap-1.5" onClick={() => { setBookingDoctor(doc); setSelectedSlot(null); }}>
                  <Video className="h-3.5 w-3.5" />
                  Book
                </Button>
              </div>
            </div>

            {/* Booking modal inline */}
            <AnimatePresence>
              {bookingDoctor?.name === doc.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Select Time Slot</h4>
                      <button onClick={() => setBookingDoctor(null)} className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.slots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                            selectedSlot === slot
                              ? "bg-primary/10 border-primary/30 text-primary font-medium"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <Calendar className="h-3 w-3 inline mr-1.5" />{slot}
                        </button>
                      ))}
                    </div>
                    <Button
                      className="w-full gap-2"
                      disabled={!selectedSlot || bookMutation.isPending}
                      onClick={() => bookMutation.mutate()}
                    >
                      {bookMutation.isPending ? (
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Confirm Booking — {doc.fee}
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
