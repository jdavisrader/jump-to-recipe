"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCookbookModal } from "./add-to-cookbook-modal";
import { cn } from "@/lib/utils";

interface AddToCookbookButtonProps {
  recipeId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function AddToCookbookButton({
  recipeId,
  className,
  variant = "outline",
  size = "sm",
  disabled = false,
}: AddToCookbookButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        disabled={disabled}
        className={cn(
          // Enhanced touch targets for mobile
          "min-h-[44px] min-w-[44px] touch-manipulation",
          // Improved focus visibility
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          className
        )}
        aria-label="Add recipe to cookbook"
        aria-describedby="add-to-cookbook-description"
      >
        <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
        Add to Cookbook
      </Button>

      {/* Hidden description for screen readers */}
      <span id="add-to-cookbook-description" className="sr-only">
        Opens a dialog to select cookbooks to add this recipe to
      </span>

      <AddToCookbookModal
        recipeId={recipeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}