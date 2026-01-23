"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RecipeImportForm } from "@/components/recipes";
import type { Recipe, NewRecipeInput } from "@/types/recipe";

export default function ImportRecipePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleImportRecipe = async (data: NewRecipeInput) => {
    if (!session?.user?.id) {
      alert("You must be logged in to import a recipe.");
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    try {
      const recipeData = {
        ...data,
        authorId: session.user.id,
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import recipe");
      }

      const recipe = await response.json();

      // Redirect to the new recipe page
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Error importing recipe:", error);
      alert(`Failed to import recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

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