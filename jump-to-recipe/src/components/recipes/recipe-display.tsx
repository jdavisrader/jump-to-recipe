"use client";

import { Clock, Minus, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeHeroImage } from "./recipe-hero-image";
import { RecipeStats } from "./recipe-stats";
import { RecipeComments } from "./recipe-comments";
import { RecipeActions } from "./recipe-actions";
import { RecipePhotosViewer } from "./recipe-photos-viewer";
import { RecipeScaler } from "./recipe-scaler";
import { CookModeToggle } from "./cook-mode-toggle";
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
    <div className="max-w-4xl mx-auto space-y-6">
      <RecipeHeroImage
        imageUrl={recipe.imageUrl}
        title={recipe.title}
        canEdit={canEdit}
        onEdit={onEdit}
      />

      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{recipe.title}</h1>

        {/* Author */}
        {recipe.authorName && (
          <p className="text-muted-foreground mb-4">By {recipe.authorName}</p>
        )}

        <div className="mb-6">
          <RecipeActions
            recipeId={recipe.id}
            canEdit={canEdit}
            onEdit={onEdit}
            sourceUrl={recipe.sourceUrl}
          />
        </div>
        
        {/* Description */}
        {recipe.description && (
          <p className="text-lg text-foreground mb-6">{recipe.description}</p>
        )}
        
        <RecipeStats
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={recipe.servings}
          scale={scale}
        />

        {/* Recipe Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <CookModeToggle />

      {/* Main Content: Ingredients (sticky) and Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ingredients - Sticky */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Ingredients</CardTitle>
                <RecipeScaler scale={scale} onChange={setScale} />
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
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.instructionSections && recipe.instructionSections.length > 0 ? (
                // Display sectioned instructions
                <div className="space-y-8">
                  {recipe.instructionSections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
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
        <Card>
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

      {/* Comments */}
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
  );
}