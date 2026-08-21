"use client";

import { useEffect, useState, type ElementType } from "react";
import {
  useTheme,
  type ColorPalette,
  type Theme,
} from "@/components/providers/ThemeProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Check } from "lucide-react";

type ModeOption = {
  value: Theme;
  label: string;
  description: string;
  icon: ElementType;
  preview: {
    bg: string;
    sidebar: string;
    card: string;
    text: string;
    accent: string;
  };
};

type PaletteOption = {
  value: ColorPalette;
  label: string;
  description: string;
  preview: string;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "light",
    label: "Light",
    description: "Clean white background",
    icon: Sun,
    preview: {
      bg: "bg-white",
      sidebar: "bg-gray-100",
      card: "bg-gray-50 border border-gray-200",
      text: "bg-gray-800",
      accent: "bg-black",
    },
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
    preview: {
      bg: "bg-zinc-900",
      sidebar: "bg-zinc-800",
      card: "bg-zinc-800 border border-zinc-700",
      text: "bg-zinc-300",
      accent: "bg-white",
    },
  },
  {
    value: "system",
    label: "System",
    description: "Follows your device",
    icon: Monitor,
    preview: {
      bg: "bg-gradient-to-br from-white to-zinc-900",
      sidebar: "bg-gradient-to-b from-gray-100 to-zinc-800",
      card: "bg-gradient-to-br from-gray-50 to-zinc-800 border border-gray-300",
      text: "bg-gradient-to-r from-gray-800 to-zinc-300",
      accent: "bg-gradient-to-r from-black to-white",
    },
  },
];

const PALETTES: PaletteOption[] = [
  {
    value: "red",
    label: "Red",
    description: "Bold red",
    preview: "bg-red-500/20",
  },
  {
    value: "rose",
    label: "Rose",
    description: "Warm rose",
    preview: "bg-rose-500/20",
  },
  {
    value: "blue",
    label: "Blue",
    description: "Default blue",
    preview: "bg-blue-500/20",
  },
  {
    value: "green",
    label: "Green",
    description: "Fresh green",
    preview: "bg-green-500/20",
  },
  {
    value: "orange",
    label: "Orange",
    description: "Warm orange",
    preview: "bg-orange-500/20",
  },
];

const ThemePreview = ({ theme }: { theme: ModeOption }) => (
  <div
    className={cn(
      "rounded-lg overflow-hidden w-full aspect-video",
      "ring-1 ring-border",
      theme.preview.bg,
    )}
  >
    <div className="flex h-full">
      <div
        className={cn("w-1/4 h-full p-1.5 space-y-1", theme.preview.sidebar)}
      >
        <div className={cn("h-1 w-3/4 rounded-sm", theme.preview.accent)} />
        <div
          className={cn("h-1 w-1/2 rounded-sm opacity-40", theme.preview.text)}
        />
        <div
          className={cn("h-1 w-2/3 rounded-sm opacity-40", theme.preview.text)}
        />
        <div
          className={cn("h-1 w-1/2 rounded-sm opacity-40", theme.preview.text)}
        />
        <div
          className={cn("h-1 w-2/3 rounded-sm opacity-30", theme.preview.text)}
        />
      </div>

      <div className="flex-1 p-1.5 space-y-1.5">
        <div className="flex gap-1 mb-2">
          <div className={cn("h-1.5 w-8 rounded-sm", theme.preview.accent)} />
          <div className="flex-1" />
          <div
            className={cn(
              "h-1.5 w-4 rounded-full opacity-40",
              theme.preview.text,
            )}
          />
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded p-1 space-y-0.5",
                theme.preview.card,
              )}
            >
              <div
                className={cn(
                  "h-0.5 w-3/4 rounded-sm opacity-60",
                  theme.preview.text,
                )}
              />
              <div
                className={cn("h-1 w-1/2 rounded-sm", theme.preview.accent)}
              />
            </div>
          ))}
        </div>

        <div className={cn("rounded p-1.5 space-y-0.5", theme.preview.card)}>
          <div
            className={cn(
              "h-0.5 w-full rounded-sm opacity-40",
              theme.preview.text,
            )}
          />
          <div
            className={cn(
              "h-0.5 w-3/4 rounded-sm opacity-30",
              theme.preview.text,
            )}
          />
          <div
            className={cn(
              "h-0.5 w-5/6 rounded-sm opacity-20",
              theme.preview.text,
            )}
          />
        </div>
      </div>
    </div>
  </div>
);

export const ThemeSelector = () => {
  const { theme, setTheme, resolvedTheme, palette, setPalette } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor size={16} />
            Appearance
          </CardTitle>
          <CardDescription>Choose how the interface looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {MODE_OPTIONS.map((option) => (
              <div key={option.value} className="space-y-2">
                <div className="rounded-lg bg-muted animate-pulse aspect-video" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {PALETTES.map((option) => (
              <div key={option.value} className="space-y-2">
                <div className="rounded-xl bg-muted animate-pulse aspect-square" />
                <div className="h-3 bg-muted animate-pulse rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Monitor size={16} />
          Appearance
        </CardTitle>
        <CardDescription>
          Pick a palette and switch between light, dark, or system mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Color mode</h3>
              <p className="text-sm text-muted-foreground">
                Choose light, dark, or follow your system setting.
              </p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              {theme === "system" ? `System (${resolvedTheme})` : theme}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "relative rounded-xl p-3 space-y-3 text-left",
                    "border-2 transition-all duration-200",
                    "hover:border-primary/50 focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={11} className="text-primary-foreground" />
                    </div>
                  )}

                  <ThemePreview theme={option} />

                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className={
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          isSelected && "text-primary",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Color palette</h3>
              <p className="text-sm text-muted-foreground">
                Pick a global accent palette for the UI.
              </p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
              {palette}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PALETTES.map((option) => {
              const isSelected = palette === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPalette(option.value)}
                  className={cn(
                    "relative rounded-xl border-2 p-3 text-left transition-all duration-200",
                    "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={11} className="text-primary-foreground" />
                    </div>
                  )}

                  <div className="rounded-2xl border border-border overflow-hidden bg-slate-950/5 p-3">
                    <div className={cn("h-16 rounded-xl", option.preview)} />
                  </div>

                  <div className="mt-3">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-tight",
                        isSelected && "text-primary",
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-2 px-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <p className="text-xs text-muted-foreground">
            Currently using{" "}
            <span className="font-medium text-foreground capitalize">
              {theme === "system" ? `system (${resolvedTheme})` : theme}
            </span>{" "}
            mode with{" "}
            <span className="font-medium text-foreground capitalize">
              {palette}
            </span>{" "}
            palette.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
