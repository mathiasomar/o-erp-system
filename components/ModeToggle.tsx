"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    // Use requestAnimationFrame to defer the state update
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  // Get label for aria-label
  const getThemeLabel = () => {
    if (!mounted) return "System";
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Switch theme (current: ${getThemeLabel()})`}
      className="relative h-10 w-10 overflow-hidden"
    >
      <div className="relative h-[1.2rem] w-[1.2rem]">
        {/* Sun Icon */}
        <Sun
          className={cn(
            "absolute inset-0 h-full w-full transition-all duration-500 ease-in-out",
            "transform-gpu",
            !mounted
              ? ""
              : theme === "light"
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 rotate-180 opacity-0",
          )}
        />

        {/* Moon Icon */}
        <Moon
          className={cn(
            "absolute inset-0 h-full w-full transition-all duration-500 ease-in-out",
            "transform-gpu",
            !mounted
              ? ""
              : theme === "dark"
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 -rotate-180 opacity-0",
          )}
        />

        {/* Monitor Icon */}
        <Monitor
          className={cn(
            "absolute inset-0 h-full w-full transition-all duration-500 ease-in-out",
            "transform-gpu",
            !mounted
              ? ""
              : theme === "system"
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 rotate-180 opacity-0",
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
