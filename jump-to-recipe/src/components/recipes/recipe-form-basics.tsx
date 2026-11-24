"use client";

import type { Control } from "react-hook-form";
import type { z } from "zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { createRecipeSchema } from "@/lib/validations/recipe";

import { FormPanel } from "@/components/recipes/form-panel";
import { RecipeImageUpload } from "@/components/recipes/recipe-image-upload";
import { RecipePhotosManager } from "@/components/recipes/recipe-photos-manager";
import { NewRecipePhotosUpload, type TempRecipePhoto } from "@/components/recipes/new-recipe-photos-upload";

export type RecipeFormValues = z.input<typeof createRecipeSchema>;

interface RecipeFormBasicsProps {
  control: Control<RecipeFormValues>;
  isLoading: boolean;
  /** Set when editing: original photos then save straight away */
  recipeId?: string;
  photos: TempRecipePhoto[];
  onPhotosChange: (photos: TempRecipePhoto[]) => void;
}

export function RecipeFormBasics({
  control,
  isLoading,
  recipeId,
  photos,
  onPhotosChange,
}: RecipeFormBasicsProps) {
  return (
    <FormPanel title="Basics">
      <div className="space-y-5">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipe name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sunday roast chicken" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What makes this one worth cooking?"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tips, swaps, or how to store leftovers..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 border-t pt-5 md:grid-cols-2">
          <section aria-labelledby="cover-photo-heading" className="space-y-3">
            <div>
              <h3 id="cover-photo-heading" className="text-sm font-medium">
                Cover photo
              </h3>
              <p className="text-sm text-muted-foreground">
                Shown at the top of the recipe and on recipe cards.
              </p>
            </div>
            <FormField
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RecipeImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange("")}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section aria-labelledby="original-recipe-heading" className="space-y-3">
            <div>
              <h3 id="original-recipe-heading" className="text-sm font-medium">
                Original recipe photos
              </h3>
              <p className="text-sm text-muted-foreground">
                Photos or scans of the handwritten or printed recipe.
              </p>
            </div>
            {recipeId ? (
              <RecipePhotosManager
                recipeId={recipeId}
                photos={photos}
                canEdit={true}
                onPhotosChange={onPhotosChange}
              />
            ) : (
              <NewRecipePhotosUpload
                photos={photos}
                onPhotosChange={onPhotosChange}
                disabled={isLoading}
              />
            )}
          </section>
        </div>
      </div>
    </FormPanel>
  );
}
