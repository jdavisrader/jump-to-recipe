"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { useDebounce } from "@/hooks/useDebounce";
import type { Recipe } from "@/types/recipe";

interface RecipeSelectorProps {
  selectedRecipes: Recipe[];
  onRecipeToggle: (recipe: Recipe) => void;
  onSelectionComplete: () => void;
}

export function RecipeSelector({
  selectedRecipes,
  onRecipeToggle,
  onSelectionComplete,
}: RecipeSelectorProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/recipes");
        
        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }
        
        const data = await response.json();
        setRecipes(data.recipes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipes");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Filter recipes based on search query (debounced)
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
  );

  const isRecipeSelected = (recipe: Recipe) =>
    selectedRecipes.some((selected) => selected.id === recipe.id);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading recipes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Select Recipes for Grocery List
          <span className="text-sm font-normal text-muted-foreground">
            {selectedRecipes.length} selected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected recipes count and action */}
        {selectedRecipes.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <span className="text-sm">
              {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={onSelectionComplete} size="sm">
              Generate Grocery List
            </Button>
          </div>
        )}

        {/* Recipe list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No recipes found matching your search." : "No recipes available."}
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="relative group cursor-pointer"
                onClick={() => onRecipeToggle(recipe)}
              >
                <div className={`transition-all ${
                  isRecipeSelected(recipe) 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-accent/50"
                } rounded-lg p-1`}>
                  <RecipeCard recipe={recipe} compact />
                </div>
                
                {/* Selection indicator */}
                <div className="absolute top-3 right-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isRecipeSelected(recipe)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background group-hover:border-primary/50"
                  }`}>
                    {isRecipeSelected(recipe) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}