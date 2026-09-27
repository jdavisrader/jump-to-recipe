"use client";

import type { KeyboardEvent } from "react";
import { ChefHat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useWakeLock } from "@/hooks/useWakeLock";

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
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <ChefHat className="h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p id="cook-mode-label" className="font-medium">Cook Mode</p>
          <p id="cook-mode-description" className="text-sm text-muted-foreground">
            Keeps your screen on while you cook
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
