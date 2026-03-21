import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  // Avatar stored in localStorage — never sent to backend
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem(`avatar_${user?.id}`) || "";
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => api.get<Profile>("/profile"),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      // Load avatar from localStorage (not from DB)
      const saved = localStorage.getItem(`avatar_${profile.id}`);
      if (saved) setAvatarUrl(saved);
    }
  }, [profile]);

  const updateMutation = useMutation({
    // Only save displayName to backend — avatar stays in localStorage
    mutationFn: () => api.put<Profile>("/profile", { displayName }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setUser({ ...updated, avatarUrl });
      toast.success("Profile updated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Compress to 150x150 JPEG and store in localStorage
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image."); return; }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 150;
      const scale = Math.min(SIZE / img.width, SIZE / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.75);
      URL.revokeObjectURL(objectUrl);
      // Save to localStorage immediately
      if (user?.id) localStorage.setItem(`avatar_${user.id}`, compressed);
      setAvatarUrl(compressed);
      toast.success("Avatar saved locally — click Save Changes to update your name");
    };
    img.src = objectUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">Profile Settings</h1>
        <p className="ai-insight-text">Manage your account details.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clinical-card space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8" />}
            </div>
            <label className="absolute -bottom-1 -right-1 p-1.5 bg-card border border-border rounded-full cursor-pointer hover:bg-secondary transition-colors">
              <Camera className="h-3 w-3 text-muted-foreground" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium">{displayName || "Set your name"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </div>

        <Button className="w-full gap-2" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="clinical-card space-y-4">
        <h2 className="medical-heading text-base">Account</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</p>
          <p>User ID: <span className="font-mono text-xs">{user?.id?.slice(0, 8)}…</span></p>
        </div>
      </motion.div>
    </div>
  );
}
