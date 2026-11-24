"use client";

import { RecipeScaler } from "./recipe-scaler";
import { scaleIngredient } from "@/lib/recipe-scaling";
import type { Ingredient, Recipe } from "@/types/recipe";

interface RecipeIngredientsListProps {
  ingredients: Ingredient[];
  ingredientSections?: Recipe["ingredientSections"];
  servings?: number | null;
  scale: number;
  onScaleChange: (scale: number) => void;
}

interface IngredientGroup {
  id: string;
  name: string;
  items: Ingredient[];
}

// Older recipes store a flat list; treat it as one unnamed group
function toGroups(
  ingredients: Ingredient[],
  sections: Recipe["ingredientSections"]
): IngredientGroup[] {
  const byPosition = (a: Ingredient, b: Ingredient) => a.position - b.position;

  if (sections && sections.length > 0) {
    return [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({ ...section, items: [...section.items].sort(byPosition) }))
      .filter((section) => section.items.length > 0);
  }
  return [{ id: "all", name: "", items: [...ingredients].sort(byPosition) }];
}

const pluralizeItems = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

export function RecipeIngredientsList({
  ingredients,
  ingredientSections,
  servings,
  scale,
  onScaleChange,
}: RecipeIngredientsListProps) {
  const groups = toGroups(ingredients, ingredientSections);

  return (
    <section
      aria-labelledby="ingredients-heading"
      className="rounded-2xl border bg-card p-6 print:border-0 print:p-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ingredients-heading" className="text-2xl font-bold tracking-tight">
          Ingredients
        </h2>
        <div className="print:hidden">
          <RecipeScaler scale={scale} onChange={onScaleChange} />
        </div>
      </div>
      {servings ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Serves {Math.round(servings * scale)}
        </p>
      ) : null}

      {groups.map((group) => (
        <div key={group.id} className="mt-5">
          {group.name && (
            <h3 className="mb-1 flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span>{group.name}</span>
              <span className="font-medium normal-case tracking-normal text-muted-foreground">
                {pluralizeItems(group.items.length)}
              </span>
            </h3>
          )}
          <ul>
            {group.items.map((ingredient) => {
              const scaled = scaleIngredient(ingredient, scale);
              return (
                <li key={ingredient.id} className="border-t py-3 first:border-t-0 print:py-1">
                  <label className="flex cursor-pointer items-start gap-3 leading-snug">
                    <input
                      type="checkbox"
                      className="peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-primary"
                    />
                    <span className="peer-checked:text-muted-foreground peer-checked:line-through">
                      {ingredient.amount > 0 && (
                        <strong className="mr-1.5 font-semibold">
                          {scaled.displayAmount || scaled.amount} {scaled.unit}
                        </strong>
                      )}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="block text-sm text-muted-foreground">
                          {ingredient.notes}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <p className="mt-5 text-sm text-muted-foreground print:hidden">
        Tick items off as you prep. Quantities follow the scale.
      </p>
    </section>
  );
}
