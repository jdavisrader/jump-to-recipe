import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RemoveRowButtonProps {
  onRemove: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Quiet ✕ for removing one ingredient or step row; sections keep the trash icon */
export function RemoveRowButton({ onRemove, ariaLabel, disabled }: RemoveRowButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onRemove}
      disabled={disabled}
      aria-label={ariaLabel}
      className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
