import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Image, X, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  imageBase64?: string;
  mimeType?: string;
}

const WELCOME: Message = {
  role: "assistant",
  content: `Hello! I'm your AI symptom checker. 👋

You can:
- **Describe your symptoms** in plain language (e.g. "I have a headache and fever since yesterday")
- **Upload a photo** of a skin condition, rash, or visible symptom
- **Ask follow-up questions** — I'll guide you through the conversation

*Remember: I provide information only, not a medical diagnosis. Always consult a doctor for proper evaluation.*

What's bothering you today?`,
};

async function streamSymptomChat(
  messages: Message[],
  onDelta: (t: string) => void,
  onDone: () => void
) {
  const payload = messages.map((m) => {
    const base: any = { role: m.role, content: m.content };
    if (m.imageBase64) { base.imageBase64 = m.imageBase64; base.mimeType = m.mimeType; }
    return base;
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");
  const resp = await fetch(`${BASE_URL}/ai/symptom-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.trim() || line.startsWith(":")) continue;
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

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, k) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={k}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={k}>{part.slice(1, -1)}</em>;
      return part;
    });
    const isListItem = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
    return (
      <p key={i} className={`${i > 0 ? "mt-1.5" : ""} ${isListItem ? "pl-3" : ""}`}>
        {parts}
      </p>
    );
  });
}

export default function SymptomCheckerPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    preview: string; base64: string; mimeType: string; file: File;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB."); return; }
    const preview = URL.createObjectURL(file);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setAttachedImage({ preview, base64, mimeType: file.type, file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeImage = () => {
    if (attachedImage) URL.revokeObjectURL(attachedImage.preview);
    setAttachedImage(null);
  };

  const send = async () => {
    const hasText = input.trim().length > 0;
    const hasImage = !!attachedImage;
    if ((!hasText && !hasImage) || isStreaming) return;

    const userMsg: Message = {
      role: "user",
      content: hasText ? input.trim() : "Please analyze this image.",
      ...(hasImage && {
        imagePreview: attachedImage!.preview,
        imageBase64: attachedImage!.base64,
        mimeType: attachedImage!.mimeType,
      }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    setIsStreaming(true);

    // Save to health entries
    if (user && hasText) {
      api.post("/health-entries", {
        entryType: "symptom",
        title: `Symptom Chat: ${input.trim().slice(0, 60)}`,
        detail: input.trim().slice(0, 200),
      }).catch(() => {});
    }

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamSymptomChat(newMessages, upsert, () => setIsStreaming(false));
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 px-1 border-b border-border flex-shrink-0">
        <div className="p-2 rounded-xl bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="medical-heading text-lg">Symptom Checker</h1>
          <p className="text-xs text-muted-foreground">Describe symptoms or upload an image — I'll help you understand what's going on.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 px-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {/* Image bubble */}
                {msg.imagePreview && (
                  <div className={`rounded-2xl overflow-hidden border border-border ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                    <img src={msg.imagePreview} alt="Uploaded" className="max-h-52 w-auto object-contain" />
                  </div>
                )}
                {/* Text bubble */}
                {msg.content && (
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mt-1">
                  <User className="h-4 w-4 text-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Image preview strip */}
      {attachedImage && (
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="relative inline-block">
            <img src={attachedImage.preview} alt="Attached" className="h-16 w-16 rounded-xl object-cover border border-border" />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl px-3 py-2 shadow-sm focus-within:border-primary/50 transition-colors">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary mb-0.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Upload image"
          >
            <Image className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            placeholder="Describe your symptoms or ask a health question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 border-0 shadow-none focus-visible:ring-0 resize-none min-h-[36px] max-h-32 py-1.5 text-sm bg-transparent"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />

          <Button
            onClick={send}
            size="icon"
            className="shrink-0 h-8 w-8 mb-0.5"
            disabled={(!input.trim() && !attachedImage) || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
