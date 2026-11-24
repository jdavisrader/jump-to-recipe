"use client";

import { RecipeHero } from "./recipe-hero";
import { RecipeStats } from "./recipe-stats";
import { RecipeComments } from "./recipe-comments";
import { RecipeActions } from "./recipe-actions";
import { RecipeOriginalPhotos } from "./recipe-original-photos";
import { RecipeIngredientsList } from "./recipe-ingredients-list";
import { CookModeToggle } from "./cook-mode-toggle";
import { RecipeJumpNav } from "./recipe-jump-nav";
import { RecipeMethod } from "./recipe-method";
import type { Recipe } from "@/types/recipe";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface RecipeDisplayProps {
  recipe: Recipe;
  onEdit?: () => void;
  canEdit?: boolean;
  showComments?: boolean;
}

export function RecipeDisplay({ recipe, onEdit, canEdit = false, showComments = true }: RecipeDisplayProps) {
  const { data: session } = useSession();
  const [commentsEnabled, setCommentsEnabled] = useState(recipe.commentsEnabled ?? true);
  const [scale, setScale] = useState(1);
  
  const isRecipeOwner = session?.user?.id === recipe.authorId;

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

      {recipe.notes && (
        <section aria-labelledby="notes-heading" className="border-t pt-8">
          <h2 id="notes-heading" className="text-2xl font-bold tracking-tight">
            Notes
          </h2>
          <p className="mt-4 max-w-prose whitespace-pre-wrap leading-relaxed">{recipe.notes}</p>
        </section>
      )}

      <RecipeOriginalPhotos recipeId={recipe.id} />

      {showComments && (
        <div className="border-t pt-8 print:hidden">
          <RecipeComments
            recipeId={recipe.id}
            recipeAuthorId={recipe.authorId || ''}
            commentsEnabled={commentsEnabled}
            onCommentsEnabledChange={setCommentsEnabled}
            isRecipeOwner={isRecipeOwner}
          />
        </div>
      )}
    </div>
  );
}