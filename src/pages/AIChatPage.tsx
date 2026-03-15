import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
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
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your AI health assistant. Ask me any health-related question, and I'll explain it in simple terms.\n\n*Remember: I provide information, not diagnoses. Always consult your doctor for medical decisions.*" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const send = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

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
      await streamChat({
        messages: newMessages,
        onDelta: upsert,
        onDone: () => setIsStreaming(false),
      });
    } catch (e: any) {
      toast.error(e.message || "Chat failed");
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="medical-heading text-2xl sm:text-3xl mb-2">AI Doctor Chat</h1>
        <p className="ai-insight-text">Get health guidance in simple, plain language.</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="p-2 rounded-xl bg-primary/10 h-fit">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
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
              <div className="p-2 rounded-xl bg-secondary h-fit">
                <User className="h-4 w-4 text-foreground" />
              </div>
            )}
          </motion.div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-primary/10 h-fit">
              <Bot className="h-4 w-4 text-primary" />
            </div>
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

      <div className="clinical-card flex gap-2 !p-3">
        <Input
          placeholder="Ask a health question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 border-0 shadow-none focus-visible:ring-0"
        />
        <Button onClick={send} size="icon" disabled={!input.trim() || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
