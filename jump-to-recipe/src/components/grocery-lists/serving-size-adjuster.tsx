"use client";

import { useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/types/recipe";

interface ServingSizeAdjusterProps {
  recipes: Recipe[];
  servingAdjustments: Record<string, number>;
  onServingChange: (recipeId: string, newServings: number) => void;
}

export function ServingSizeAdjuster({
  recipes,
  servingAdjustments,
  onServingChange,
}: ServingSizeAdjusterProps) {
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);

  const getServingSize = (recipe: Recipe) => {
    return servingAdjustments[recipe.id] || recipe.servings || 1;
  };

  const handleServingChange = (recipe: Recipe, change: number) => {
    const currentServings = getServingSize(recipe);
    const newServings = Math.max(1, currentServings + change);
    onServingChange(recipe.id, newServings);
  };

  const handleDirectInput = (recipe: Recipe, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onServingChange(recipe.id, numValue);
    }
  };

  const getScaleFactor = (recipe: Recipe) => {
    const originalServings = recipe.servings || 1;
    const currentServings = getServingSize(recipe);
    return currentServings / originalServings;
  };

  if (recipes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Adjust Serving Sizes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipes.map((recipe) => {
          const currentServings = getServingSize(recipe);
          const originalServings = recipe.servings || 1;
          const scaleFactor = getScaleFactor(recipe);
          const isEditing = editingRecipe === recipe.id;

          return (
            <div
              key={recipe.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{recipe.title}</h4>
                <div className="text-sm text-muted-foreground">
                  Original: {originalServings} serving{originalServings !== 1 ? 's' : ''}
                  {scaleFactor !== 1 && (
                    <span className="ml-2 text-primary">
                      (×{scaleFactor.toFixed(1)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleServingChange(recipe, -1)}
                  disabled={currentServings <= 1}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                {isEditing ? (
                  <Input
                    type="number"
                    min="1"
                    value={currentServings}
                    onChange={(e) => handleDirectInput(recipe, e.target.value)}
                    onBlur={() => setEditingRecipe(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingRecipe(null);
                      }
                    }}
                    className="w-16 h-8 text-center"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingRecipe(recipe.id)}
                    className="w-16 h-8 text-center border rounded hover:bg-accent transition-colors"
                  >
                    {currentServings}
                  </button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleServingChange(recipe, 1)}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}

        {recipes.some(recipe => getScaleFactor(recipe) !== 1) && (
          <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <strong>Note:</strong> Ingredient quantities will be automatically scaled 
            based on your serving size adjustments.
          </div>
        )}
      </CardContent>
    </Card>
  );
}