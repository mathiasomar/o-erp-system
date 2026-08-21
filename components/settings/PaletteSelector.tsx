"use client";

import { useEffect, useState } from "react";
import {
  useTheme,
  type ColorPalette,
} from "@/components/providers/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTES: { value: ColorPalette; label: string; preview: string }[] = [
  { value: "red", label: "Red", preview: "bg-red-500/20" },
  { value: "rose", label: "Rose", preview: "bg-rose-500/20" },
  { value: "blue", label: "Blue", preview: "bg-blue-500/20" },
  { value: "green", label: "Green", preview: "bg-green-500/20" },
  { value: "orange", label: "Orange", preview: "bg-orange-500/20" },
];

export const PaletteSelector = () => {
  const { palette, setPalette } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Theme colors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 p-2">
          {PALETTES.map((p) => {
            const isSelected = palette === p.value;

            return (
              <button
                key={p.value}
                onClick={() => setPalette(p.value)}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-lg border transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card",
                )}
                aria-pressed={isSelected}
                title={p.label}
              >
                <div className={cn("h-8 w-8 rounded-full", p.preview)} />
                {isSelected && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaletteSelector;
