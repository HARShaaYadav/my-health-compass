import { motion } from "framer-motion";
import {
  FileText,
  ClipboardList,
  Stethoscope,
  MessageCircle,
  Bell,
  History,
  Video,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Heart,
  Pill,
} from "lucide-react";
import { Link } from "react-router-dom";

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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="page-section-hero text-center lg:text-left"
      >
        <h1 className="medical-heading text-3xl sm:text-4xl lg:text-5xl mb-4">
          Your health, decoded.
        </h1>
        <p className="ai-insight-text text-lg max-w-2xl">
          Upload prescriptions, understand lab reports, check symptoms, and get AI-powered health guidance — all in one place.
        </p>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.path} variants={fadeUp}>
              <Link
                to={action.path}
                className="clinical-card group flex items-start gap-4 hover:-translate-y-0.5"
              >
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

      {/* Health Overview Cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="clinical-card-normal">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Health Score</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">--</p>
          <p className="text-xs text-muted-foreground mt-1">Complete a checkup to get your score</p>
        </motion.div>

        <motion.div variants={fadeUp} className="clinical-card-info">
          <div className="flex items-center gap-3 mb-3">
            <Pill className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Active Medicines</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">Add medicines from prescriptions</p>
        </motion.div>

        <motion.div variants={fadeUp} className="clinical-card-normal">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Reports Analyzed</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">Upload your first medical report</p>
        </motion.div>
      </motion.div>

      {/* Secondary Actions */}
      <div>
        <h2 className="medical-heading text-lg mb-4">More Tools</h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {secondaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.path} variants={fadeUp}>
                <Link
                  to={action.path}
                  className="clinical-card flex flex-col items-center gap-2 text-center py-5 hover:-translate-y-0.5"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Emergency Banner */}
      <Link to="/emergency" className="block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="clinical-card-danger flex items-center gap-4 cursor-pointer hover:-translate-y-0.5"
        >
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
