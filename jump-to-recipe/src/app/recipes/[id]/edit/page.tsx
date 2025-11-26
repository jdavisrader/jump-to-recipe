"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RecipeForm } from "@/components/recipes";
import type { Recipe, NewRecipeInput } from "@/types/recipe";
import type { RecipePhoto } from "@/types/recipe-photos";

interface EditRecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<(Recipe & { photos?: RecipePhoto[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch the recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Fetch recipe data
        const recipeResponse = await fetch(`/api/recipes/${id}`);
        if (!recipeResponse.ok) {
          throw new Error('Failed to fetch recipe');
        }
        const recipeData = await recipeResponse.json();

        // Fetch recipe photos
        const photosResponse = await fetch(`/api/recipes/${id}/photos`);
        let photos: RecipePhoto[] = [];
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          photos = photosData.photos || [];
        }

        setRecipe({ ...recipeData, photos });
      } catch (error) {
        console.error('Error fetching recipe:', error);
        alert('Failed to load recipe');
        router.push('/recipes');
      } finally {
        setIsLoadingRecipe(false);
      }
    };

    fetchRecipe();
  }, [id, router]);

  const handleUpdateRecipe = async (data: NewRecipeInput, photos?: RecipePhoto[]) => {
    if (!session?.user?.id) {
      alert("You must be logged in to edit a recipe.");
      router.push("/auth/login");
      return;
    }

    if (!recipe) {
      alert("Recipe not found.");
      return;
    }

    // Check if user is the author
    if (recipe.authorId !== session.user.id) {
      alert("You can only edit your own recipes.");
      router.push(`/recipes/${id}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update recipe");
      }

      // Redirect back to the recipe page
      router.push(`/recipes/${id}`);
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert(`Failed to update recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === "loading" || isLoadingRecipe) {
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

  // Show error if recipe not found
  if (!recipe) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">
          <p>Recipe not found.</p>
        </div>
      </div>
    );
  }

  // Check if user is the author
  if (recipe.authorId !== session?.user?.id) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">
          <p>You can only edit your own recipes.</p>
          <button 
            onClick={() => router.push(`/recipes/${id}`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Recipe</h1>
        <p className="text-muted-foreground">
          Update your recipe details
        </p>
      </div>

      <RecipeForm
        initialData={{
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          notes: recipe.notes,
          imageUrl: recipe.imageUrl,
          sourceUrl: recipe.sourceUrl,
          visibility: recipe.visibility,
          photos: recipe.photos,
        }}
        onSubmit={handleUpdateRecipe}
        isLoading={isLoading}
        submitLabel="Update Recipe"
        recipeId={recipe.id}
      />
    </div>
  );
}