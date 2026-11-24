"use client";

import { Clock, Minus, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeHero } from "./recipe-hero";
import { RecipeStats } from "./recipe-stats";
import { RecipeComments } from "./recipe-comments";
import { RecipeActions } from "./recipe-actions";
import { RecipePhotosViewer } from "./recipe-photos-viewer";
import { RecipeScaler } from "./recipe-scaler";
import { CookModeToggle } from "./cook-mode-toggle";
import { RecipeJumpNav, getMethodSectionId } from "./recipe-jump-nav";
import { scaleIngredient } from "@/lib/recipe-scaling";
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ingredients - Sticky */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6 print:border-0 print:shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Ingredients</CardTitle>
                <div className="print:hidden">
                  <RecipeScaler scale={scale} onChange={setScale} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recipe.ingredientSections && recipe.ingredientSections.length > 0 ? (
                // Display sectioned ingredients
                <div className="space-y-6">
                  {recipe.ingredientSections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
                        <h4 className="font-semibold text-sm mb-3 text-primary">
                          {section.name}
                        </h4>
                        <ul className="space-y-3">
                          {section.items.map((ingredient) => {
                            const scaled = scaleIngredient(ingredient, scale);
                            return (
                            <li key={ingredient.id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                aria-label={`Check off ${ingredient.name}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {ingredient.amount > 0 && (
                                    <span className="text-muted-foreground mr-2">
                                      {scaled.displayAmount || scaled.amount} {scaled.unit}
                                    </span>
                                  )}
                                  {ingredient.name}
                                </div>
                                {ingredient.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    {ingredient.notes}
                                  </div>
                                )}
                              </div>
                            </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                </div>
              ) : (
                // Display flat ingredients (backward compatible)
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient) => {
                    const scaled = scaleIngredient(ingredient, scale);
                    return (
                    <li key={ingredient.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={`Check off ${ingredient.name}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {ingredient.amount > 0 && (
                            <span className="text-muted-foreground mr-2">
                              {scaled.displayAmount || scaled.amount} {scaled.unit}
                            </span>
                          )}
                          {ingredient.name}
                        </div>
                        {ingredient.notes && (
                          <div className="text-sm text-muted-foreground">
                            {ingredient.notes}
                          </div>
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-3">
          <Card className="print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.instructionSections && recipe.instructionSections.length > 0 ? (
                // Display sectioned instructions
                <div className="space-y-8">
                  {recipe.instructionSections
                    .sort((a, b) => a.order - b.order)
                    .map((section, sectionIndex) => (
                      <div
                        key={section.id}
                        id={getMethodSectionId(sectionIndex + 1)}
                        className="scroll-mt-24"
                      >
                        <h4 className="font-semibold text-lg mb-4 text-primary">
                          {section.name}
                        </h4>
                        <ol className="space-y-4">
                          {section.items.map((instruction) => (
                            <li key={instruction.id} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                {instruction.step}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="text-sm leading-relaxed">
                                  {instruction.content}
                                </div>
                                {instruction.duration && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {instruction.duration} min
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                </div>
              ) : (
                // Display flat instructions (backward compatible)
                <ol className="space-y-4">
                  {recipe.instructions
                    .sort((a, b) => a.step - b.step)
                    .map((instruction) => (
                      <li key={instruction.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {instruction.step}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-sm leading-relaxed">
                            {instruction.content}
                          </div>
                          {instruction.duration && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {instruction.duration} min
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </CardContent>
          </Card>
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