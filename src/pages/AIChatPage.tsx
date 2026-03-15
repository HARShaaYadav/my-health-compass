import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const mockResponses: Record<string, string> = {
  default: "I can help you understand health-related topics. Try asking about common conditions, medications, or general wellness advice. Remember, I provide information — not diagnoses.",
  cholesterol: "**High cholesterol** means there's too much cholesterol in your blood, which can increase your risk of heart disease.\n\n**Key points:**\n- LDL (\"bad\" cholesterol) should ideally be below 100 mg/dL\n- HDL (\"good\" cholesterol) should be above 60 mg/dL\n- Lifestyle changes like diet and exercise can help\n\n*Recommended specialist: Cardiologist or General Physician*",
  cold: "For a **common cold**, here's what may help:\n\n1. **Rest** — your body needs energy to fight the infection\n2. **Hydration** — drink plenty of fluids\n3. **Warm liquids** — tea with honey can soothe a sore throat\n4. **Over-the-counter relief** — decongestants and pain relievers\n\nSee a doctor if symptoms last more than 10 days or worsen significantly.",
  headache: "**Headaches** can have many causes:\n\n- **Tension headache** — most common, feels like pressure around the forehead\n- **Migraine** — throbbing pain, often one-sided, with nausea\n- **Cluster headache** — severe, around one eye\n\n*If headaches are frequent or severe, consult a Neurologist.*",
};

const getResponse = (input: string): string => {
  const lower = input.toLowerCase();
  if (lower.includes("cholesterol")) return mockResponses.cholesterol;
  if (lower.includes("cold") || lower.includes("flu")) return mockResponses.cold;
  if (lower.includes("headache") || lower.includes("migraine")) return mockResponses.headache;
  return mockResponses.default;
};

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your AI health assistant. Ask me any health-related question, and I'll do my best to explain it in simple terms.\n\n*Remember: I provide information, not diagnoses. Always consult your doctor for medical decisions.*" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: getResponse(userMsg.content) }]);
      setIsTyping(false);
    }, 1200);
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
            transition={{ delay: i * 0.02 }}
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
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={k}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith("*") && part.endsWith("*")) {
                      return <em key={k} className="font-serif-insight">{part.slice(1, -1)}</em>;
                    }
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

        {isTyping && (
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
        <Button onClick={send} size="icon" disabled={!input.trim() || isTyping}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
