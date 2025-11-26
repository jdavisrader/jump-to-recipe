"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useToast } from "@/components/ui/use-toast";

interface DeleteRecipeSectionProps {
  recipeId: string;
  recipeTitle: string;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

export function DeleteRecipeSection({
  recipeId,
  recipeTitle,
  onDeleteSuccess,
  onDeleteError,
}: DeleteRecipeSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      // Treat 404 as success (recipe already deleted - idempotent)
      if (response.status === 404 || response.ok) {
        toast({
          title: "Recipe deleted",
          description: "Recipe deleted successfully",
        });

        // Close modal
        setIsModalOpen(false);

        // Call success callback if provided
        onDeleteSuccess?.();

        // Redirect to my recipes
        router.push("/my-recipes");
        return;
      }

      // Handle authorization errors
      if (response.status === 401) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to delete recipes",
          variant: "destructive",
        });
        setIsModalOpen(false);
        router.push("/auth/login");
        return;
      }

      if (response.status === 403) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to delete this recipe",
          variant: "destructive",
        });
        setIsModalOpen(false);
        return;
      }

      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete recipe");
    } catch (error) {
      console.error("Error deleting recipe:", error);

      // Detect network errors
      let errorMessage = "An unexpected error occurred";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Deletion failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Call error callback if provided
      onDeleteError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsModalOpen(true)}
        aria-label={`Delete recipe: ${recipeTitle}`}
      >
        Delete Recipe
      </Button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        description={`Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
