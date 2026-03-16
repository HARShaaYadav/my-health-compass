import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Phone, MapPin, Heart, Activity, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const emergencySigns = [
  "Severe chest pain or pressure",
  "Difficulty breathing or shortness of breath",
  "Sudden weakness or numbness on one side",
  "Severe allergic reaction (swelling, difficulty swallowing)",
  "Uncontrolled bleeding",
  "Loss of consciousness",
  "Severe head injury",
  "Sudden vision loss",
];

interface NearbyHospital {
  name: string;
  distance: string;
  url: string;
}

export default function EmergencyPage() {
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState<NearbyHospital[] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const findHospitals = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Open Google Maps with hospitals search
        const mapsUrl = `https://www.google.com/maps/search/hospital+emergency+near+me/@${latitude},${longitude},14z`;
        
        setHospitals([
          { name: "Search Hospitals on Google Maps", distance: "Based on your location", url: mapsUrl },
        ]);
        setLocating(false);
        
        // Also open in new tab
        window.open(mapsUrl, "_blank");
        toast.success("Opening nearby hospitals in Google Maps");
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          default:
            setLocationError("Unable to get your location. Try searching manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="clinical-card-danger">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            <h1 className="medical-heading text-2xl sm:text-3xl text-destructive">Emergency Help</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            If you or someone is experiencing a medical emergency, call emergency services immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => window.open("tel:911")}
            >
              <Phone className="h-5 w-5" />
              Call 911
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={findHospitals}
              disabled={locating}
            >
              {locating ? (
                <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              {locating ? "Finding hospitals..." : "Find Nearest Hospital"}
            </Button>
          </div>

          {locationError && (
            <p className="text-sm text-destructive mt-3">{locationError}</p>
          )}

          {hospitals && (
            <div className="mt-4 space-y-2">
              {hospitals.map((h, i) => (
                <a
                  key={i}
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background transition-colors"
                >
                  <Navigation className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.distance}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="medical-heading text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-destructive" />
          Warning Signs — Seek Immediate Help
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencySigns.map((sign, i) => (
            <motion.div
              key={sign}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10"
            >
              <Heart className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-sm">{sign}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="clinical-card">
        <h3 className="medical-heading text-sm mb-3">Quick Emergency Numbers</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Emergency (US)", number: "911" },
            { label: "Poison Control", number: "1-800-222-1222" },
            { label: "Suicide & Crisis", number: "988" },
            { label: "Emergency (EU)", number: "112" },
          ].map(item => (
            <button
              key={item.number}
              onClick={() => window.open(`tel:${item.number}`)}
              className="flex items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left"
            >
              <Phone className="h-4 w-4 text-destructive flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold tabular-nums">{item.number}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="clinical-card-warning flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Important: </span>
          This page is for guidance only. In a real emergency, always call your local emergency number or go to the nearest emergency room.
        </p>
      </div>
    </div>
  );
}
