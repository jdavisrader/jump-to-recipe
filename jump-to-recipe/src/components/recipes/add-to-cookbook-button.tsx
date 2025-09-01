"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isLoading] = useState(false); // Will be used in task 3

  const handleClick = () => {
    if (disabled || isLoading) return;
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
        disabled={disabled || isLoading}
        className={cn(className)}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Add to Cookbook
      </Button>

      {/* Modal will be implemented in task 3 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Add to Cookbook</h2>
            <p className="text-muted-foreground mb-4">
              Modal implementation coming in task 3...
            </p>
            <Button onClick={handleCloseModal} variant="outline">
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}