"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BusinessAIProps {
  branchId?: string;
}

export function BusinessAI({ branchId }: BusinessAIProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/business",

      body: {
        branchId,
      },
    }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    sendMessage({
      text: input,
    });

    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-primary-foreground"
                : "mr-auto max-w-[80%] rounded-lg bg-muted p-3"
            }
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return <div key={`${message.id}-${index}`}>{part.text}</div>;
              }

              return null;
            })}
          </div>
        ))}

        {status === "submitted" && (
          <div className="text-sm text-muted-foreground">
            Analyzing your business data...
          </div>
        )}

        {status === "streaming" && (
          <div className="text-sm text-muted-foreground">
            Generating analysis...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message || "Something went wrong."}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business..."
          disabled={status === "submitted" || status === "streaming"}
        />

        <Button
          type="submit"
          disabled={
            !input.trim() || status === "submitted" || status === "streaming"
          }
        >
          Send
        </Button>
      </form>
    </div>
  );
}
