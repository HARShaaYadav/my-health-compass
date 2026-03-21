import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, setToken } from "@/lib/api";
import { useAuth, AuthUser } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
        setToken(data.token);
        setUser(data.user);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const data = await api.post<{ token: string; user: AuthUser }>("/auth/signup", { email, password, displayName: displayName || email });
        setToken(data.token);
        setUser(data.user);
        toast.success("Account created!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-8 w-8 text-primary" />
            <span className="medical-heading text-2xl">MedExplain AI</span>
          </div>
          <p className="ai-insight-text">Your personal health intelligence platform</p>
        </div>

        <div className="clinical-card">
          <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>{mode === "login" ? "Sign In" : "Create Account"}<ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
