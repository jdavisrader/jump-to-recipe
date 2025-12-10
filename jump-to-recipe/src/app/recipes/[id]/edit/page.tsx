"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RecipeForm, DeleteRecipeSection, AssignOwnerSection } from "@/components/recipes";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithRetry } from "@/lib/api-retry";
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
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; email: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [optimisticOwnerInfo, setOptimisticOwnerInfo] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Check if user can delete the recipe
  const canDelete = useMemo(() => {
    if (!session?.user || !recipe) return false;

    const isOwner = recipe.authorId === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isElevated = session.user.role === 'elevated';

    return isOwner || isAdmin || isElevated;
  }, [session, recipe]);

  // Check if user can edit the recipe (owner or admin)
  const canEdit = useMemo(() => {
    if (!session?.user || !recipe) return false;

    const isOwner = recipe.authorId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    return isOwner || isAdmin;
  }, [session, recipe]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return session?.user?.role === 'admin';
  }, [session]);

  // Fetch the recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setFetchError(null);
        
        // Fetch recipe data with retry
        const recipeData = await fetchWithRetry<Recipe>(
          `/api/recipes/${id}`,
          undefined,
          {
            maxRetries: 3,
            onRetry: (error, attempt) => {
              console.log(`Retrying recipe fetch (attempt ${attempt}):`, error.message);
              toast({
                title: "Connection issue",
                description: `Retrying... (attempt ${attempt})`,
                variant: "default",
              });
            },
          }
        );

        // Fetch recipe photos (non-critical, don't retry as aggressively)
        let photos: RecipePhoto[] = [];
        try {
          const photosData = await fetchWithRetry<{ photos: RecipePhoto[] }>(
            `/api/recipes/${id}/photos`,
            undefined,
            { maxRetries: 1 }
          );
          photos = photosData.photos || [];
        } catch (photoError) {
          console.warn('Failed to fetch photos:', photoError);
          // Don't fail the whole page if photos fail
        }

        setRecipe({ ...recipeData, photos });
        
        // Set initial owner ID
        if (recipeData.authorId) {
          setSelectedOwnerId(recipeData.authorId);
          
          // Fetch owner information for admin users
          if (session?.user?.role === 'admin') {
            try {
              const usersData = await fetchWithRetry<{ users: Array<{ id: string; name: string; email: string }> }>(
                '/api/admin/users',
                undefined,
                { maxRetries: 1 }
              );
              const owner = usersData.users?.find((u) => u.id === recipeData.authorId);
              if (owner) {
                setOwnerInfo({ name: owner.name, email: owner.email });
              }
            } catch (err) {
              console.error('Error fetching owner info:', err);
              // Non-critical, continue without owner info
            }
          }
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load recipe';
        setFetchError(errorMessage);
        
        toast({
          title: "Error loading recipe",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingRecipe(false);
      }
    };

    fetchRecipe();
  }, [id, router, session, toast]);

  const handleUpdateRecipe = async (data: NewRecipeInput, photos?: RecipePhoto[]) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to edit a recipe.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    if (!recipe) {
      toast({
        title: "Recipe not found",
        description: "The recipe you're trying to edit could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Check if user can edit (owner or admin)
    const isOwner = recipe.authorId === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own recipes.",
        variant: "destructive",
      });
      router.push(`/recipes/${id}`);
      return;
    }

    setIsLoading(true);
    
    // Check if ownership is being changed
    const isOwnershipChange = isAdmin && selectedOwnerId && selectedOwnerId !== recipe.authorId;
    
    // Optimistic update for ownership change
    let previousOwnerInfo: { name: string; email: string } | null = null;
    if (isOwnershipChange) {
      previousOwnerInfo = ownerInfo;
      
      // Find new owner info for optimistic update
      try {
        const usersData = await fetchWithRetry<{ users: Array<{ id: string; name: string; email: string }> }>(
          '/api/admin/users',
          undefined,
          { maxRetries: 1 }
        );
        const newOwner = usersData.users?.find((u) => u.id === selectedOwnerId);
        if (newOwner) {
          setOptimisticOwnerInfo({ name: newOwner.name, email: newOwner.email });
          setOwnerInfo({ name: newOwner.name, email: newOwner.email });
        }
      } catch (err) {
        console.warn('Failed to fetch new owner info for optimistic update:', err);
      }
    }
    
    try {
      // Prepare update data
      const updateData: any = { ...data };
      
      // Include authorId if it has changed (admin only)
      if (isOwnershipChange) {
        updateData.authorId = selectedOwnerId;
      }
      
      // Use retry logic for the update
      await fetchWithRetry(
        `/api/recipes/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
        {
          maxRetries: 2,
          onRetry: (error, attempt) => {
            console.log(`Retrying recipe update (attempt ${attempt}):`, error.message);
            toast({
              title: "Retrying...",
              description: `Attempting to save changes (attempt ${attempt})`,
              variant: "default",
            });
          },
        }
      );

      // Clear optimistic update on success
      setOptimisticOwnerInfo(null);

      // Show success message
      if (isOwnershipChange) {
        toast({
          title: "Recipe updated successfully",
          description: "Recipe ownership has been transferred.",
          variant: "default",
        });
      } else {
        toast({
          title: "Recipe updated",
          description: "Your changes have been saved successfully.",
          variant: "default",
        });
      }

      // Redirect back to the recipe page
      router.push(`/recipes/${id}`);
    } catch (error) {
      console.error("Error updating recipe:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Revert optimistic update on error
      if (isOwnershipChange && previousOwnerInfo) {
        setOwnerInfo(previousOwnerInfo);
        setOptimisticOwnerInfo(null);
      }
      
      toast({
        title: "Failed to update recipe",
        description: errorMessage,
        variant: "destructive",
      });
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
        <div className="text-center space-y-4">
          <p className="text-lg">{fetchError || "Recipe not found."}</p>
          <button 
            onClick={() => router.push('/recipes')}
            className="text-blue-600 hover:underline"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  // Check if user can edit (owner or admin)
  if (!canEdit) {
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
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Recipe edit page error:', error, errorInfo);
        toast({
          title: "Something went wrong",
          description: "An unexpected error occurred. Please refresh the page.",
          variant: "destructive",
        });
      }}
    >
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
          beforeSubmit={
            isAdmin && ownerInfo ? (
              <ErrorBoundary
                fallback={
                  <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">
                      Failed to load owner assignment section. Please refresh the page.
                    </p>
                  </div>
                }
              >
                <AssignOwnerSection
                  currentOwnerId={recipe.authorId || ""}
                  currentOwnerName={(optimisticOwnerInfo || ownerInfo)?.name || ""}
                  currentOwnerEmail={(optimisticOwnerInfo || ownerInfo)?.email || ""}
                  onOwnerChange={setSelectedOwnerId}
                  isAdmin={isAdmin}
                />
              </ErrorBoundary>
            ) : undefined
          }
        />

        {canDelete && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-destructive">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Once you delete a recipe, there is no going back.
                </p>
              </div>
              <DeleteRecipeSection
                recipeId={recipe.id}
                recipeTitle={recipe.title}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}