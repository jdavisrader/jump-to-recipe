"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RecipeForm } from "@/components/recipes";
import type { NewRecipeInput } from "@/types/recipe";
import type { RecipePhoto } from "@/types/recipe-photos";

// Extended RecipePhoto type for new recipe uploads
interface TempRecipePhoto extends RecipePhoto {
  _tempFile?: File;
}

export default function NewRecipePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleCreateRecipe = async (data: NewRecipeInput, photos?: TempRecipePhoto[]) => {
    if (!session?.user?.id) {
      alert("You must be logged in to create a recipe.");
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    try {
      const recipeData = {
        ...data,
        authorId: session.user.id,
      };

      // First, create the recipe
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create recipe");
      }

      const recipe = await response.json();
      
      // If there are photos, upload them to the new recipe
      if (photos && photos.length > 0) {
        try {
          // Upload each photo file to the new recipe
          const photoUploadPromises = photos.map(async (photo, index) => {
            // Check if this is a temporary photo with a file
            const tempPhoto = photo as any;
            if (tempPhoto._tempFile) {
              const formData = new FormData();
              formData.append('photos', tempPhoto._tempFile);

              const photoResponse = await fetch(`/api/recipes/${recipe.id}/photos`, {
                method: "POST",
                body: formData,
              });
              
              if (!photoResponse.ok) {
                console.error(`Failed to upload photo ${photo.fileName} to recipe`);
              }
              
              return photoResponse;
            }
          });
          
          await Promise.all(photoUploadPromises.filter(Boolean));
        } catch (photoError) {
          console.error("Error uploading photos to recipe:", photoError);
          // Don't fail the entire recipe creation if photo upload fails
        }
      }
      
      // Redirect to the new recipe page
      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert(`Failed to create recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
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