import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Search, Star, Calendar, Clock, X, Check, PhoneOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const doctors = [
  { name: "Dr. Sarah Chen", specialty: "General Physician", rating: 4.8, slots: ["Today, 3:00 PM", "Today, 5:00 PM", "Tomorrow, 10:00 AM"], fee: "$30" },
  { name: "Dr. Raj Patel", specialty: "Cardiologist", rating: 4.9, slots: ["Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM", "Tomorrow, 4:00 PM"], fee: "$50" },
  { name: "Dr. Emily Rodriguez", specialty: "Dermatologist", rating: 4.7, slots: ["Today, 5:30 PM", "Tomorrow, 11:00 AM", "Tomorrow, 3:00 PM"], fee: "$45" },
  { name: "Dr. James Kim", specialty: "ENT Specialist", rating: 4.6, slots: ["Tomorrow, 11:00 AM", "Tomorrow, 2:00 PM", "Tomorrow, 10:00 AM"], fee: "$40" },
  { name: "Dr. Lisa Wang", specialty: "Neurologist", rating: 4.8, slots: ["Tomorrow, 9:00 AM", "Tomorrow, 1:00 PM"], fee: "$55" },
  { name: "Dr. Ahmed Hassan", specialty: "Orthopedic Surgeon", rating: 4.7, slots: ["Tomorrow, 11:00 AM", "Tomorrow, 4:00 PM"], fee: "$60" },
];

interface Booking {
  _id: string;
  doctorName: string;
  specialty: string;
  notes: string | null;
  status: string;
  appointmentTime: string;
  roomUrl?: string;
}

// Parse slot string like "Today, 3:00 PM" or "Tomorrow, 10:00 AM" into a real Date
function parseSlotToDate(slot: string): Date {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (slot.startsWith("Today")) {
    const timePart = slot.replace("Today, ", "");
    return parseTimeIntoDate(base, timePart);
  }
  if (slot.startsWith("Tomorrow")) {
    base.setDate(base.getDate() + 1);
    const timePart = slot.replace("Tomorrow, ", "");
    return parseTimeIntoDate(base, timePart);
  }
  // "Mar 20, 9:00 AM" format
  return new Date(`${slot} ${now.getFullYear()}`);
}

function parseTimeIntoDate(base: Date, time: string): Date {
  const [timePart, meridiem] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes);
}

// Generate a deterministic room name from booking id
function getRoomUrl(bookingId: string): string {
  const room = `medexplain-${bookingId.slice(-8)}`;
  return `https://meet.jit.si/${room}`;
}

// Check if appointment is joinable (within 10 min before or 30 min after)
function isJoinable(appointmentTime: string): boolean {
  const appt = new Date(appointmentTime);
  const now = new Date();
  const diffMs = appt.getTime() - now.getTime();
  const diffMin = diffMs / 60000;
  return diffMin <= 10 && diffMin >= -30;
}

function getTimeLabel(appointmentTime: string): string {
  const appt = new Date(appointmentTime);
  const now = new Date();
  const diffMs = appt.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin > 0) return `in ${diffMin}m`;
  if (diffMin === 0) return "now";
  return `${Math.abs(diffMin)}m ago`;
}

export default function ConsultationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<typeof doctors[0] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ url: string; doctorName: string } | null>(null);
  const [, setTick] = useState(0);

  // Tick every 10s to update joinable/time-label state
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const { data: bookings = [] } = useQuery({
    queryKey: ["consultations", user?.id],
    queryFn: () => api.get<Booking[]>("/consultations"),
    enabled: !!user,
  });

  const activeBookings = bookings.filter((b) => b.status === "booked");

  const bookMutation = useMutation({
    mutationFn: () => {
      if (!bookingDoctor || !selectedSlot) throw new Error("Select a slot");
      const appointmentTime = parseSlotToDate(selectedSlot).toISOString();
      return api.post<Booking>("/consultations", {
        doctorName: bookingDoctor.name,
        specialty: bookingDoctor.specialty,
        appointmentTime,
        fee: bookingDoctor.fee,
        notes: `Slot: ${selectedSlot}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-count"] });
      toast.success(`Appointment booked with ${bookingDoctor?.name}!`);
      setBookingDoctor(null); setSelectedSlot(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.put(`/consultations/${id}`, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      toast.success("Appointment cancelled");
    },
  });

  const joinCall = (booking: Booking) => {
    const url = getRoomUrl(booking._id);
    setActiveCall({ url, doctorName: booking.doctorName });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Online Consultation</h1>
        <p className="ai-insight-text">Book video consultations with verified specialists.</p>
      </motion.div>

      {/* In-page video call */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="clinical-card overflow-hidden !p-0"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">In call with {activeCall.doctorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                  onClick={() => window.open(activeCall.url, "_blank")}>
                  <Maximize2 className="h-3.5 w-3.5" />Full screen
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs"
                  onClick={() => setActiveCall(null)}>
                  <PhoneOff className="h-3.5 w-3.5" />End Call
                </Button>
              </div>
            </div>
            <iframe
              src={activeCall.url}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-[480px] border-0"
              title="Video consultation"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booked appointments */}
      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="medical-heading text-lg">Your Appointments</h2>
          {activeBookings.map((b) => {
            const joinable = isJoinable(b.appointmentTime);
            const timeLabel = getTimeLabel(b.appointmentTime);
            return (
              <motion.div key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="clinical-card-info flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="medical-heading text-sm">{b.doctorName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {b.specialty} · {b.notes?.replace("Slot: ", "")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(b.appointmentTime).toLocaleString()} · {timeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {joinable ? (
                    <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700"
                      onClick={() => joinCall(b)}>
                      <Video className="h-3.5 w-3.5" />Join Call
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-full">
                      Booked · {timeLabel}
                    </span>
                  )}
                  <button onClick={() => cancelMutation.mutate(b._id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Cancel
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="clinical-card !p-3">
        <div className="flex gap-2">
          <Search className="h-5 w-5 text-muted-foreground mt-2.5 ml-2" />
          <Input placeholder="Search by specialty, doctor name..."
            className="border-0 shadow-none focus-visible:ring-0"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Doctor list */}
      <div className="space-y-3">
        {filteredDoctors.map((doc, i) => (
          <motion.div key={doc.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }} className="clinical-card">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-semibold text-base sm:text-lg shrink-0">
                {doc.name.split(" ").slice(1).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="medical-heading text-base">{doc.name}</h3>
                <p className="text-sm text-muted-foreground">{doc.specialty}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{doc.rating}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.slots[0]}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums mb-2">{doc.fee}</p>
                <Button size="sm" className="gap-1.5"
                  onClick={() => { setBookingDoctor(doc); setSelectedSlot(null); }}>
                  <Video className="h-3.5 w-3.5" />Book
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {bookingDoctor?.name === doc.name && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Select Time Slot</h4>
                      <button onClick={() => setBookingDoctor(null)}
                        className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.slots.map((slot) => (
                        <button key={slot} onClick={() => setSelectedSlot(slot)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                            selectedSlot === slot
                              ? "bg-primary/10 border-primary/30 text-primary font-medium"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}>
                          <Calendar className="h-3 w-3 inline mr-1.5" />{slot}
                        </button>
                      ))}
                    </div>
                    <Button className="w-full gap-2"
                      disabled={!selectedSlot || bookMutation.isPending}
                      onClick={() => bookMutation.mutate()}>
                      {bookMutation.isPending
                        ? <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        : <><Check className="h-4 w-4" />Confirm Booking — {doc.fee}</>}
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
