"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useBranchId } from "@/hooks/use-branches";
import { toast } from "sonner";

type Insight = {
  type: "trend" | "alert" | "tip";
  title: string;
  content: string;
};

const INSIGHT_CONFIG = {
  trend: {
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  tip: {
    icon: Lightbulb,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
};

export const AiInsightsWidget = () => {
  const { data: branchId = "" } = useBranchId();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const generate = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId,
            messages: [
              {
                role: "user",
                content: `Generate exactly 3 business insights for today in this JSON format.
Return ONLY valid JSON, no other text:
[
  { "type": "trend", "title": "Short title", "content": "2-3 sentence insight about sales trends" },
  { "type": "alert", "title": "Short title", "content": "2-3 sentence urgent alert about inventory or cash flow" },
  { "type": "tip",   "title": "Short title", "content": "2-3 sentence actionable tip to improve profit" }
]`,
              },
            ],
          }),
        });

        if (!res.ok) {
          let message = "AI service is unavailable right now.";
          try {
            const data = await res.json();
            if (typeof data?.error === "string") {
              message = data.error;
            }
          } catch {}

          toast.error(message);
          setLoaded(true);
          setInsights([
            {
              type: "tip",
              title: "Check your dashboard",
              content:
                "Visit the AI Assistant page for detailed business insights.",
            },
          ]);
          return;
        }

        // Read the stream and extract the text
        const reader = res.body?.getReader();
        if (!reader) {
          toast.error("AI service did not return a valid response.");
          return;
        }

        let fullText = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          // Extract text from AI SDK data stream format
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const text = JSON.parse(line.slice(2));
                fullText += text;
              } catch {}
            }
          }
        }

        // Parse the JSON from the response
        try {
          const jsonMatch = fullText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Insight[];
            setInsights(parsed);
            setLoaded(true);
          }
        } catch {
          // Fallback insights if parsing fails
          setInsights([
            {
              type: "tip",
              title: "Check your dashboard",
              content:
                "Visit the AI Assistant page for detailed business insights.",
            },
          ]);
          setLoaded(true);
        }
      } catch (error) {
        console.error("AI insights error:", error);
        toast.error("Unable to generate AI insights right now.");
        setLoaded(true);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            AI Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              PBOT
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={generate}
              disabled={isPending}
            >
              <RefreshCw
                size={13}
                className={cn(isPending && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loaded && !isPending && (
          <div
            className="flex flex-col items-center justify-center
                           py-8 gap-3 text-center"
          >
            <Sparkles size={24} className="text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium">AI-powered insights</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get instant analysis of your business data
              </p>
            </div>
            <Button size="sm" onClick={generate}>
              <Sparkles size={13} className="mr-1.5" />
              Generate insights
            </Button>
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ))}
          </div>
        )}

        {loaded &&
          !isPending &&
          insights.map((insight, i) => {
            const cfg = INSIGHT_CONFIG[insight.type];
            const Icon = cfg.icon;
            return (
              <div key={i} className={cn("rounded-lg p-3 space-y-1", cfg.bg)}>
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={cfg.color} />
                  <p className={cn("text-xs font-semibold", cfg.color)}>
                    {insight.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.content}
                </p>
              </div>
            );
          })}

        {loaded && (
          <Link href="/dashboard/ai">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
            >
              Open AI Assistant
              <ChevronRight size={13} className="ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
