import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, Bot, User, Trash2, MessageSquare,
  AlertCircle, Stethoscope, BookOpen, Zap,
} from "lucide-react";
import { streamChat } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What IHC markers distinguish IDC from ILC of the breast?",
  "Explain Gleason grading system for prostate cancer",
  "What are the nuclear features of papillary thyroid carcinoma?",
  "How do you differentiate UIP from NSIP on lung biopsy?",
  "What is the significance of Ki-67 in tumor grading?",
  "Describe the Bethesda system for thyroid FNA",
  "What special stain identifies amyloid deposits?",
  "Explain CK7/CK20 matrix in determining carcinoma origin",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build history for API
    const history = [...messages, userMsg].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let assistantText = "";
    const assistantId = crypto.randomUUID();

    try {
      await streamChat(
        history,
        (chunk) => {
          assistantText += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantId) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantText } : m
              );
            }
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant" as const,
                content: assistantText,
                timestamp: new Date(),
              },
            ];
          });
        },
        () => setIsLoading(false)
      );
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to get response";
      toast({ title: "Chat error", description: msg, variant: "destructive" });
      setMessages((prev) =>
        prev[prev.length - 1]?.id === assistantId
          ? prev.filter((m) => m.id !== assistantId)
          : prev
      );
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-border bg-card px-4 py-4 sm:px-5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "var(--gradient-primary)" }}>
          <Stethoscope size={18} className="text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">Caren musulia AI</p>
          <p className="text-xs text-muted-foreground">Advanced pathology support for study and review</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="w-2 h-2 rounded-full bg-clinical-success animate-pulse" />
          <span className="text-xs text-clinical-success">Online</span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear conversation"
              className="ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-clinical-danger hover:bg-clinical-danger/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 sm:px-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "var(--gradient-primary)", opacity: 0.9 }}>
                <Bot size={28} className="text-primary-foreground" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground mb-2">Ask Me Anything</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                I'm trained as an expert histopathologist with deep knowledge of surgical pathology, cytopathology, IHC, molecular markers, and the WHO classification system.
              </p>
            </div>

            <p className="text-xs font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">Suggested Questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="text-left p-3 rounded-xl border border-border bg-secondary hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 group"
                >
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors">{q}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                ${msg.role === "assistant"
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-foreground"
                }
              `}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>

              {/* Bubble */}
              <div className={`
                max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%]
                ${msg.role === "assistant"
                  ? "bg-card border border-border rounded-tl-sm"
                  : "rounded-tr-sm"
                }
              `}
                style={msg.role === "user" ? { background: "var(--gradient-primary)" } : {}}
              >
                {msg.role === "assistant" ? (
                  <div className="prose-pathology text-foreground text-sm">
                    {msg.content ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 size={13} className="animate-spin" />
                        Analyzing...
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-primary-foreground">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, delay: d, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about histopathology, IHC, staining techniques, diagnoses..."
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors scrollbar-thin"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-10 min-w-10 flex-shrink-0 items-center justify-center rounded-xl px-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed sm:w-10 sm:px-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          Press Enter to send · Shift+Enter for new line · For educational use only
        </p>
      </div>
    </div>
  );
}
