import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Plus, MessageCircle, Trash2, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  mimeType?: string;
  imagePreview?: string; // local object URL for display
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({ messages, onDelta, onDone }: { messages: ChatMessage[]; onDelta: (text: string) => void; onDone: () => void }) {
  // Build payload — include imageBase64 for messages that have it
  const payload = messages.map(m => {
    const base: any = { role: m.role, content: m.content };
    if (m.imageBase64) {
      base.imageBase64 = m.imageBase64;
      base.mimeType = m.mimeType || "image/jpeg";
    }
    return base;
  });

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages: payload }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${resp.status})`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { buffer = line + "\n" + buffer; break; }
    }
  }
  onDone();
}

export default function AIChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your AI health assistant. Ask me any health-related question, and I'll explain it in simple terms.\n\n*Remember: I provide information, not diagnoses. Always consult your doctor for medical decisions.*" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string; base64: string; mimeType: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_conversations").select("*").order("updated_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setAttachedImage({ file, preview, base64, mimeType: file.type });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeImage = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.preview);
      setAttachedImage(null);
    }
  };

  const loadConversation = async (id: string) => {
    const { data, error } = await supabase.from("chat_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (error) { toast.error("Failed to load conversation"); return; }
    setConversationId(id);
    setMessages(data.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })));
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([
      { role: "assistant", content: "Hello! I'm your AI health assistant. Ask me any health-related question, and I'll explain it in simple terms.\n\n*Remember: I provide information, not diagnoses. Always consult your doctor for medical decisions.*" },
    ]);
    setShowHistory(false);
    removeImage();
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    if (conversationId === id) startNewConversation();
    toast.success("Conversation deleted");
  };

  const send = async () => {
    const hasText = input.trim().length > 0;
    const hasImage = !!attachedImage;
    if ((!hasText && !hasImage) || isStreaming || !user) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: hasText ? input.trim() : (hasImage ? "Please analyze this image." : ""),
      ...(hasImage && {
        imageBase64: attachedImage!.base64,
        mimeType: attachedImage!.mimeType,
        imagePreview: attachedImage!.preview,
      }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    setIsStreaming(true);

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const title = (hasText ? input.trim() : "Image analysis").slice(0, 50);
      const { data, error } = await supabase.from("chat_conversations").insert({ user_id: user.id, title }).select("id").single();
      if (error) { toast.error("Failed to create conversation"); setIsStreaming(false); return; }
      convId = data.id;
      setConversationId(convId);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    }

    // Save user message (text only — images are transient)
    await supabase.from("chat_messages").insert({ conversation_id: convId, role: "user", content: userMsg.content });

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({ messages: newMessages, onDelta: upsert, onDone: async () => {
        setIsStreaming(false);
        if (convId && assistantContent) {
          await supabase.from("chat_messages").insert({ conversation_id: convId, role: "assistant", content: assistantContent });
        }
      }});
    } catch (e: any) {
      toast.error(e.message || "Chat failed");
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="medical-heading text-2xl sm:text-3xl mb-1">AI Doctor Chat</h1>
          <p className="ai-insight-text text-sm">Get health guidance in simple, plain language.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowHistory(!showHistory)}>
            <MessageCircle className="h-3.5 w-3.5" />
            History
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={startNewConversation}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </motion.div>

      {showHistory && conversations.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 clinical-card !p-3 space-y-1 max-h-48 overflow-y-auto">
          {conversations.map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 group">
              <button onClick={() => loadConversation(c.id)} className={`flex-1 text-left text-sm px-3 py-2 rounded-lg hover:bg-secondary transition-colors truncate ${conversationId === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                {c.title || "Untitled"}
              </button>
              <button onClick={() => deleteConversation(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="p-2 rounded-xl bg-primary/10 h-fit"><Bot className="h-4 w-4 text-primary" /></div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="Attached" className="rounded-lg mb-2 max-h-48 w-auto object-contain" />
              )}
              {msg.content.split("\n").map((line, j) => (
                <p key={j} className={j > 0 ? "mt-2" : ""}>
                  {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, k) => {
                    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith("*") && part.endsWith("*")) return <em key={k} className="font-serif-insight">{part.slice(1, -1)}</em>;
                    return part;
                  })}
                </p>
              ))}
            </div>
            {msg.role === "user" && (
              <div className="p-2 rounded-xl bg-secondary h-fit"><User className="h-4 w-4 text-foreground" /></div>
            )}
          </motion.div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-primary/10 h-fit"><Bot className="h-4 w-4 text-primary" /></div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Image preview strip */}
      {attachedImage && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="relative inline-block">
            <img src={attachedImage.preview} alt="Attached" className="h-16 w-16 rounded-lg object-cover border border-border" />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{attachedImage.file.name}</span>
        </div>
      )}

      <div className="clinical-card flex items-center gap-2 !p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
        >
          <Image className="h-5 w-5" />
        </Button>
        <Input
          placeholder={attachedImage ? "Add a message or send image..." : "Ask a health question..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 border-0 shadow-none focus-visible:ring-0"
        />
        <Button onClick={send} size="icon" disabled={(!input.trim() && !attachedImage) || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
