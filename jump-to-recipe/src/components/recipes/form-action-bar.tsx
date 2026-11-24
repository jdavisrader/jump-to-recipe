"use client";

import { Button } from "@/components/ui/button";

interface FormActionBarProps {
  submitLabel: string;
  /** "Cancel" on create, "Discard changes" on edit */
  cancelLabel?: string;
  isLoading: boolean;
  isValid: boolean;
  errorCount: number;
  onCancel?: () => void;
}

// Stays pinned to the bottom of the screen while the form scrolls, so Save is always in reach
export function FormActionBar({
  submitLabel,
  cancelLabel = "Cancel",
  isLoading,
  isValid,
  errorCount,
  onCancel,
}: FormActionBarProps) {
  const errorHint =
    errorCount > 0
      ? `Fix ${errorCount} ${errorCount === 1 ? "error" : "errors"} to save`
      : "Fix the errors above to save";

  return (
    <div className="sticky bottom-0 z-20 border-t bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!isValid && !isLoading && (
          <p className="mr-auto text-sm text-destructive">{errorHint}</p>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !isValid}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
