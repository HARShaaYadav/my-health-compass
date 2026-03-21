import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ClipboardList, Stethoscope, MessageCircle,
  Bell, History, Video, Shield, AlertTriangle,
  TrendingUp, Heart, Pill, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const quickActions = [
  { path: "/prescription", label: "Scan Prescription", icon: FileText, description: "Upload & decode doctor handwriting", color: "primary" },
  { path: "/report", label: "Translate Report", icon: ClipboardList, description: "Understand lab results in plain language", color: "accent" },
  { path: "/symptoms", label: "Check Symptoms", icon: Stethoscope, description: "AI-powered symptom analysis", color: "primary" },
  { path: "/chat", label: "AI Doctor Chat", icon: MessageCircle, description: "Ask health questions instantly", color: "accent" },
];

const secondaryActions = [
  { path: "/reminders", label: "Medicine Reminders", icon: Bell },
  { path: "/history", label: "Health History", icon: History },
  { path: "/consultation", label: "Book Consultation", icon: Video },
  { path: "/insurance", label: "Insurance Help", icon: Shield },
];

const healthTips = [
  "Drink at least 8 glasses of water daily to stay hydrated and support kidney function.",
  "Aim for 7–9 hours of sleep each night — poor sleep is linked to higher heart disease risk.",
  "Take short walking breaks every 60 minutes if you sit for long periods during work.",
  "Include leafy greens in at least one meal today — they're rich in iron and vitamins.",
  "Practice deep breathing for 2 minutes when stressed — it lowers cortisol levels measurably.",
  "Schedule your annual health checkup if it's been more than 12 months.",
  "Limit processed sugar intake — excess sugar contributes to inflammation and metabolic issues.",
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function computeHealthScore(counts: { reminders: number; reports: number; entries: number; checks: number; consultations: number }) {
  let score = 0;
  if (counts.reminders > 0) score += 20;
  if (counts.reports > 0) score += 20;
  if (counts.entries > 0) score += 20;
  if (counts.checks > 0) score += 20;
  if (counts.consultations > 0) score += 20;
  return score;
}

function getScoreLabel(score: number) {
  if (score === 0) return "Get started";
  if (score <= 20) return "Just beginning";
  if (score <= 40) return "Building up";
  if (score <= 60) return "On track";
  if (score <= 80) return "Great progress";
  return "Excellent";
}

function getScoreColor(score: number) {
  if (score <= 20) return "text-muted-foreground";
  if (score <= 40) return "text-warning";
  if (score <= 60) return "text-accent";
  return "text-primary";
}

export default function HomePage() {
  const { user } = useAuth();
  const [dailyTip] = useState(() => healthTips[Math.floor(Math.random() * healthTips.length)]);

  const { data: reminderData } = useQuery({ queryKey: ["reminder-count", user?.id], queryFn: () => api.get<{ count: number }>("/reminders/count"), enabled: !!user });
  const { data: reportData } = useQuery({ queryKey: ["report-count", user?.id], queryFn: () => api.get<{ count: number }>("/reports/count"), enabled: !!user });
  const { data: entryData } = useQuery({ queryKey: ["entry-count", user?.id], queryFn: () => api.get<{ count: number }>("/health-entries/count"), enabled: !!user });
  const { data: checkData } = useQuery({ queryKey: ["check-count", user?.id], queryFn: () => api.get<{ count: number }>("/symptom-checks/count"), enabled: !!user });
  const { data: consultData } = useQuery({ queryKey: ["consultation-count", user?.id], queryFn: () => api.get<{ count: number }>("/consultations/count"), enabled: !!user });

  const reminderCount = reminderData?.count ?? 0;
  const reportCount = reportData?.count ?? 0;
  const entryCount = entryData?.count ?? 0;
  const checkCount = checkData?.count ?? 0;
  const consultationCount = consultData?.count ?? 0;

  const healthScore = computeHealthScore({ reminders: reminderCount, reports: reportCount, entries: entryCount, checks: checkCount, consultations: consultationCount });

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="page-section-hero text-center lg:text-left">
        <h1 className="medical-heading text-3xl sm:text-4xl lg:text-5xl mb-4">Your health, decoded.</h1>
        <p className="ai-insight-text text-lg max-w-2xl">Upload prescriptions, understand lab reports, check symptoms, and get AI-powered health guidance — all in one place.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card-info flex items-start gap-4">
        <div className="p-2 rounded-xl bg-accent/10 flex-shrink-0"><Sparkles className="h-5 w-5 text-accent" /></div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-accent mb-1">Daily Health Tip</h3>
          <p className="ai-insight-text text-sm">{dailyTip}</p>
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.path} variants={fadeUp}>
              <Link to={action.path} className="clinical-card group flex items-start gap-4 hover:-translate-y-0.5">
                <div className={`p-3 rounded-xl ${action.color === "primary" ? "bg-primary/10" : "bg-accent/10"}`}>
                  <Icon className={`h-6 w-6 ${action.color === "primary" ? "text-primary" : "text-accent"}`} />
                </div>
                <div>
                  <h3 className="medical-heading text-base mb-1">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="clinical-card-normal">
          <div className="flex items-center gap-3 mb-3"><Heart className="h-5 w-5 text-primary" /><span className="text-sm font-medium text-muted-foreground">Health Score</span></div>
          <p className={`text-3xl font-semibold tabular-nums ${getScoreColor(healthScore)}`}>{healthScore}</p>
          <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(healthScore)}</p>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-primary rounded-full" />
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="clinical-card-info">
          <div className="flex items-center gap-3 mb-3"><Pill className="h-5 w-5 text-accent" /><span className="text-sm font-medium text-muted-foreground">Active Medicines</span></div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{reminderCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{reminderCount === 0 ? "Add medicines from prescriptions" : "Active reminders set"}</p>
        </motion.div>
        <motion.div variants={fadeUp} className="clinical-card-normal">
          <div className="flex items-center gap-3 mb-3"><TrendingUp className="h-5 w-5 text-primary" /><span className="text-sm font-medium text-muted-foreground">Reports Analyzed</span></div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{reportCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{reportCount === 0 ? "Upload your first medical report" : "Reports processed"}</p>
        </motion.div>
      </motion.div>

      <div>
        <h2 className="medical-heading text-lg mb-4">More Tools</h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {secondaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.path} variants={fadeUp}>
                <Link to={action.path} className="clinical-card flex flex-col items-center gap-2 text-center py-5 hover:-translate-y-0.5">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <Link to="/emergency" className="block">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="clinical-card-danger flex items-center gap-4 cursor-pointer hover:-translate-y-0.5">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div>
            <h3 className="medical-heading text-base text-destructive">Emergency Help</h3>
            <p className="text-sm text-muted-foreground">Feeling urgent symptoms? Get immediate guidance and locate nearest hospitals.</p>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
