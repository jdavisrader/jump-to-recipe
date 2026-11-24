"use client";

import type { KeyboardEvent } from "react";
import { ChefHat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useWakeLock } from "@/hooks/useWakeLock";
import { cn } from "@/lib/utils";

/**
 * Labeled switch that keeps the screen awake while cooking.
 * Hidden on browsers without the Screen Wake Lock API.
 */
export function CookModeToggle() {
  const { isSupported, isActive, enable, disable } = useWakeLock();
  const { toast } = useToast();

  if (!isSupported) return null;

  const toggleCookMode = async (checked: boolean) => {
    if (!checked) return disable();

    const isKeptAwake = await enable();
    if (!isKeptAwake) {
      toast({
        title: "Couldn't keep your screen on",
        description: "Your device didn't allow it right now. Try again in a moment.",
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggleCookMode(!isActive);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
        isActive ? "border-primary/50 bg-primary/10" : "bg-muted/40"
      )}
    >
      <div className="flex items-center gap-3">
        <ChefHat className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p id="cook-mode-label" className="font-semibold">Cook Mode</p>
          <p id="cook-mode-description" aria-live="polite" className="text-sm text-muted-foreground">
            {isActive ? "On · your screen will stay awake" : "Keeps your screen on while you cook"}
          </p>
        </div>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={toggleCookMode}
        onKeyDown={handleKeyDown}
        aria-labelledby="cook-mode-label"
        aria-describedby="cook-mode-description"
      />
    </div>
  );
}
