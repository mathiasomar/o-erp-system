"use client";

import { AiAssistant } from "@/components/ai/AiAssistant";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function AiPage() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles size={22} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Real-time business intelligence powered by Open AI
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AiAssistant />
      </div>
    </div>
  );
}
