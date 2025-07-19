"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeImportForm } from "@/components/recipes";
import type { Recipe, NewRecipeInput } from "@/types/recipe";

export default function ImportRecipePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImportRecipe = async (data: NewRecipeInput) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual user ID from session
      const recipeData = {
        ...data,
        authorId: "demo-user-id", // This should come from the authenticated user
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        throw new Error("Failed to import recipe");
      }

      const recipe = await response.json();
      
      // Redirect to the new recipe page
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Error importing recipe:", error);
      alert("Failed to import recipe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewRecipe = async (url: string): Promise<Recipe | null> => {
    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to preview recipe");
      }

      const recipe = await response.json();
      return recipe;
    } catch (error) {
      console.error("Error previewing recipe:", error);
      alert("Failed to preview recipe. Please check the URL and try again.");
      return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <RecipeImportForm
        onImport={handleImportRecipe}
        onPreview={handlePreviewRecipe}
        isLoading={isLoading}
      />
    </div>
  );
}