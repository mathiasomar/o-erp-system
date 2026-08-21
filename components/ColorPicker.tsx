"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#0ea5e9",
  "#a855f7",
  "#f43f5e",
];

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState(value ?? "#6b7280");

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setCustom(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) onChange(hex);
  }

  return (
    <div className="space-y-3">
      {/* Swatches */}
      <div className="grid grid-cols-6 gap-2">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color);
              setCustom(color);
            }}
            className={cn(
              "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 flex items-center justify-center",
              value === color
                ? "border-foreground scale-110"
                : "border-transparent",
            )}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <Check size={12} className="text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-md border shrink-0"
          style={{ backgroundColor: value || "#6b7280" }}
        />
        <Input
          placeholder="#6b7280"
          value={custom}
          onChange={handleCustomChange}
          maxLength={7}
          className="font-mono text-sm"
        />
        {/* Native color picker as extra helper */}
        <input
          type="color"
          value={value || "#6b7280"}
          onChange={(e) => {
            onChange(e.target.value);
            setCustom(e.target.value);
          }}
          className="w-9 h-9 rounded-md border cursor-pointer p-0.5"
          title="Open color picker"
        />
      </div>
    </div>
  );
}
