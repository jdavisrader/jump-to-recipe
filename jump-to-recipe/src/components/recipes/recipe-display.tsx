"use client";

import { Clock, Users, ChefHat, ExternalLink, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeImage } from "./recipe-image";
import { RecipeComments } from "./recipe-comments";
import type { Recipe } from "@/types/recipe";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface RecipeDisplayProps {
  recipe: Recipe;
  onEdit?: () => void;
  canEdit?: boolean;
}

export function RecipeDisplay({ recipe, onEdit, canEdit = false }: RecipeDisplayProps) {
  const { data: session } = useSession();
  const [commentsEnabled, setCommentsEnabled] = useState(recipe.commentsEnabled ?? true);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  const isRecipeOwner = session?.user?.id === recipe.authorId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            )}
          </div>
          {canEdit && (
            <Button onClick={onEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Recipe
            </Button>
          )}
        </div>

        {/* Recipe Image */}
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <RecipeImage
            src={recipe.imageUrl}
            alt={recipe.title}
            width={800}
            height={450}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Recipe Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min total</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="flex items-center gap-1">
              <ChefHat className="h-4 w-4" />
              <span className="capitalize">{recipe.difficulty}</span>
            </div>
          )}
        </div>

        {/* Times Breakdown */}
        {(recipe.prepTime || recipe.cookTime) && (
          <div className="flex gap-4 text-sm">
            {recipe.prepTime && (
              <div>
                <span className="font-medium">Prep:</span> {recipe.prepTime} min
              </div>
            )}
            {recipe.cookTime && (
              <div>
                <span className="font-medium">Cook:</span> {recipe.cookTime} min
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Source Link */}
        {recipe.sourceUrl && (
          <div>
            <Button asChild variant="outline" size="sm">
              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original Recipe
              </a>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="space-y-1">
                  <div className="font-medium">
                    {ingredient.amount > 0 && (
                      <span className="text-muted-foreground mr-2">
                        {ingredient.displayAmount || ingredient.amount} {ingredient.unit}
                      </span>
                    )}
                    {ingredient.name}
                  </div>
                  {ingredient.notes && (
                    <div className="text-sm text-muted-foreground ml-2">
                      {ingredient.notes}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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

      {/* Comments and Notes Section */}
      <RecipeComments
        recipeId={recipe.id}
        recipeAuthorId={recipe.authorId || ''}
        commentsEnabled={commentsEnabled}
        onCommentsEnabledChange={setCommentsEnabled}
        isRecipeOwner={isRecipeOwner}
      />
    </div>
  );
}