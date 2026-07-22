"use client";

import { Button } from "@/components/ui/button";

interface RecipeScalerProps {
  scale: number;
  onChange: (scale: number) => void;
}

const PRESETS: { value: number; label: string }[] = [
  { value: 0.5, label: "½×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
];

/**
 * Segmented ½ / 1× / 2× control for non-destructively scaling a recipe's
 * ingredient amounts and servings on the display view.
 */
export function RecipeScaler({ scale, onChange }: RecipeScalerProps) {
  return (
    <div
      role="group"
      aria-label="Scale recipe"
      className="inline-flex items-center rounded-md border p-0.5"
    >
      {PRESETS.map((preset) => (
        <Button
          key={preset.value}
          type="button"
          size="sm"
          variant={scale === preset.value ? "default" : "ghost"}
          aria-pressed={scale === preset.value}
          onClick={() => onChange(preset.value)}
          className="h-7 px-2.5"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
