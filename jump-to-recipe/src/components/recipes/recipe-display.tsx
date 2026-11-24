"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeHero } from "./recipe-hero";
import { RecipeStats } from "./recipe-stats";
import { RecipeComments } from "./recipe-comments";
import { RecipeActions } from "./recipe-actions";
import { RecipePhotosViewer } from "./recipe-photos-viewer";
import { RecipeIngredientsList } from "./recipe-ingredients-list";
import { CookModeToggle } from "./cook-mode-toggle";
import { RecipeJumpNav } from "./recipe-jump-nav";
import { RecipeMethod } from "./recipe-method";
import type { Recipe } from "@/types/recipe";
import type { RecipePhoto } from "@/types/recipe-photos";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface RecipeDisplayProps {
  recipe: Recipe;
  onEdit?: () => void;
  canEdit?: boolean;
  showComments?: boolean;
}

export function RecipeDisplay({ recipe, onEdit, canEdit = false, showComments = true }: RecipeDisplayProps) {
  const { data: session } = useSession();
  const [commentsEnabled, setCommentsEnabled] = useState(recipe.commentsEnabled ?? true);
  const [photos, setPhotos] = useState<RecipePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [scale, setScale] = useState(1);
  
  const isRecipeOwner = session?.user?.id === recipe.authorId;

  // Fetch recipe photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setPhotosLoading(true);
        const response = await fetch(`/api/recipes/${recipe.id}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || []);
        } else {
          console.error('Failed to fetch photos:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchPhotos();
  }, [recipe.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <RecipeHero recipe={recipe} canEdit={canEdit} onEdit={onEdit}>
        <RecipeStats
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={recipe.servings}
          difficulty={recipe.difficulty}
          scale={scale}
        />
        <RecipeActions recipeId={recipe.id} canEdit={canEdit} onEdit={onEdit} />
      </RecipeHero>

      <div className="flex flex-col gap-3 print:hidden">
        <RecipeJumpNav sections={recipe.instructionSections ?? []} />
        <CookModeToggle />
      </div>

      {/* Main Content: Ingredients (sticky) and Instructions */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <RecipeIngredientsList
            ingredients={recipe.ingredients}
            ingredientSections={recipe.ingredientSections}
            servings={recipe.servings}
            scale={scale}
            onScaleChange={setScale}
          />
        </div>

        <div className="min-w-0 lg:col-span-3">
          <RecipeMethod
            instructions={recipe.instructions}
            instructionSections={recipe.instructionSections}
          />
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {recipe.notes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original recipe photos */}
      <div className="print:hidden">
        {photosLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Original recipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : photos.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Original recipe</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipePhotosViewer photos={photos} />
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Comments */}
      <div className="print:hidden">
        {showComments && (
          <RecipeComments
            recipeId={recipe.id}
            recipeAuthorId={recipe.authorId || ''}
            commentsEnabled={commentsEnabled}
            onCommentsEnabledChange={setCommentsEnabled}
            isRecipeOwner={isRecipeOwner}
          />
        )}
      </div>
    </div>
  );
}