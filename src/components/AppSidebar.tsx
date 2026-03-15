import { Link, useLocation } from "react-router-dom";
import {
  Home, FileText, ClipboardList, Stethoscope, MessageCircle,
  Bell, History, Video, Shield, AlertTriangle, Menu, X, Activity, LogOut,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/prescription", label: "Scan Prescription", icon: FileText },
  { path: "/report", label: "Medical Report", icon: ClipboardList },
  { path: "/symptoms", label: "Symptom Checker", icon: Stethoscope },
  { path: "/chat", label: "AI Doctor Chat", icon: MessageCircle },
  { path: "/reminders", label: "Medicine Reminders", icon: Bell },
  { path: "/history", label: "Health History", icon: History },
  { path: "/consultation", label: "Consultation", icon: Video },
  { path: "/insurance", label: "Insurance Help", icon: Shield },
  { path: "/emergency", label: "Emergency", icon: AlertTriangle },
];

export default function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="medical-heading text-lg">MedExplain AI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-foreground/20" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 z-40 h-full w-[280px] bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-border">
          <Activity className="h-7 w-7 text-primary" />
          <span className="medical-heading text-xl">MedExplain AI</span>
        </div>
        <div className="lg:hidden h-14" />

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isEmergency = item.path === "/emergency";
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${
                  isActive ? (isEmergency ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")
                    : isEmergency ? "text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          {user && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.email}</p>
              </div>
              <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center leading-relaxed">
            Not a medical diagnosis.<br />Always consult your doctor.
          </p>
        </div>
      </aside>
    </>
  );
}
