"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const FloatingActions = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    qc.invalidateQueries();
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    // ── Fixed bottom-right ──────────────────
    <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-2">
      {/* Back */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-lg
                       bg-background/90 backdrop-blur-sm
                       border-border/60 hover:border-primary/50"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Go back</TooltipContent>
      </Tooltip>

      {/* Refresh */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-lg
                       bg-background/90 backdrop-blur-sm
                       border-border/60 hover:border-primary/50"
            onClick={handleRefresh}
            aria-label="Refresh page data"
          >
            <RefreshCw
              size={16}
              className={cn(
                "transition-transform duration-500",
                spinning && "animate-spin",
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Refresh</TooltipContent>
      </Tooltip>
    </div>
  );
};
