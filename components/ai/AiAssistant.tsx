"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useBranchId } from "@/hooks/use-branches";

// Quick prompt suggestions
const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: "Sales trends",
    prompt:
      "Analyse my sales trends for the last 30 days and highlight any patterns.",
  },
  {
    icon: Package,
    label: "Inventory",
    prompt:
      "Which products should I restock urgently? Give me a priority list.",
  },
  {
    icon: DollarSign,
    label: "Profit tips",
    prompt:
      "How can I improve my profit margin? Identify my biggest opportunities.",
  },
  {
    icon: Users,
    label: "Customers",
    prompt: "Give me insights about my customer base and how to grow it.",
  },
  {
    icon: AlertTriangle,
    label: "Risks",
    prompt: "What are the biggest risks to my business right now?",
  },
  {
    icon: TrendingUp,
    label: "Best sellers",
    prompt:
      "What are my best and worst performing products? What should I do about it?",
  },
];

type Props = {
  compact?: boolean; // smaller version for sidebar embed
};

export const AiAssistant = ({ compact = false }: Props) => {
  const { data: branchId = "" } = useBranchId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [showPrompts, setShowPrompts] = useState(true);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      body: { branchId },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput("");
    setShowPrompts(false);
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleQuickPrompt = (prompt: string) => {
    setShowPrompts(false);
    sendMessage({ text: prompt });
  };

  const reset = () => {
    setMessages([]);
    setShowPrompts(true);
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        compact ? "h-full" : "h-[calc(100vh-8rem)] max-w-3xl mx-auto",
      )}
    >
      {/* Header */}
      {!compact && (
        <div className="shrink-0 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Business Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Powered by OpenAI · Real-time business data
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-muted-foreground"
            >
              <RotateCcw size={13} className="mr-1.5" />
              New chat
            </Button>
          )}
        </div>
      )}

      {/* Quick prompts */}
      {showPrompts && (
        <div className="shrink-0 space-y-3 mb-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Quick insights
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                           border border-border bg-card hover:border-primary/50
                           hover:bg-muted/50 text-left transition-colors group"
              >
                <Icon
                  size={14}
                  className="text-muted-foreground group-hover:text-primary
                             transition-colors shrink-0"
                />
                <span className="text-xs font-medium truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1"
      >
        {messages.length === 0 && !showPrompts && (
          <div
            className="flex flex-col items-center justify-center h-32
                           gap-2 text-muted-foreground"
          >
            <Bot size={28} className="opacity-30" />
            <p className="text-sm">Ask me anything about your business</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" && "flex-row-reverse",
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {msg.role === "user" ? (
                "You"
              ) : (
                <Bot size={14} className="text-muted-foreground" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted/60 rounded-tl-sm",
              )}
            >
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                                 prose-p:my-1 prose-ul:my-1 prose-li:my-0
                                 prose-headings:text-sm prose-headings:font-semibold"
              >
                {msg.parts.map((part, index) =>
                  part.type === "text" ? (
                    <ReactMarkdown key={index}>{part.text}</ReactMarkdown>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div
              className="shrink-0 h-7 w-7 rounded-full bg-muted
                             flex items-center justify-center"
            >
              <Bot size={14} className="text-muted-foreground" />
            </div>
            <div
              className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3
                             flex items-center gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground
                               animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 mt-3">
        <Separator className="mb-3" />
        <form id="ai-form" onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about sales, inventory, profits..."
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          AI analyses real business data · Not financial advice
        </p>
      </div>
    </div>
  );
};
