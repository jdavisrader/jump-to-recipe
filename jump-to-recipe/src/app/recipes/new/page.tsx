"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipes";
import type { NewRecipeInput } from "@/types/recipe";

export default function NewRecipePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateRecipe = async (data: NewRecipeInput) => {
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
        throw new Error("Failed to create recipe");
      }

      const recipe = await response.json();
      
      // Redirect to the new recipe page
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Recipe</h1>
        <p className="text-muted-foreground">
          Share your favorite recipe with the community
        </p>
      </div>

      <RecipeForm
        onSubmit={handleCreateRecipe}
        isLoading={isLoading}
        submitLabel="Create Recipe"
      />
    </div>
  );
}