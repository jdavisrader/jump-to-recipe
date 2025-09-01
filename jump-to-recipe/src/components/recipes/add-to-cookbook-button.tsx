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
        className={cn(className)}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Add to Cookbook
      </Button>

      <AddToCookbookModal
        recipeId={recipeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}