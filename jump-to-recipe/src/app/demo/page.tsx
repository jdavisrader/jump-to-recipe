"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RecipeForm,
  RecipeDisplay,
  RecipeCard,
  RecipeImportForm,
  RecipeEditor,
} from "@/components/recipes";
import type { Recipe, NewRecipeInput } from "@/types/recipe";

// Mock recipe data for demonstration
const mockRecipe: Recipe = {
  id: uuidv4(),
  title: "Classic Chocolate Chip Cookies",
  description: "Soft and chewy chocolate chip cookies that are perfect for any occasion.",
  ingredients: [
    { id: uuidv4(), name: "All-purpose flour", amount: 2.25, unit: "cup", notes: "sifted" },
    { id: uuidv4(), name: "Baking soda", amount: 1, unit: "tsp", notes: "" },
    { id: uuidv4(), name: "Salt", amount: 1, unit: "tsp", notes: "" },
    { id: uuidv4(), name: "Butter", amount: 1, unit: "cup", notes: "softened" },
    { id: uuidv4(), name: "Brown sugar", amount: 0.75, unit: "cup", notes: "packed" },
    { id: uuidv4(), name: "White sugar", amount: 0.75, unit: "cup", notes: "" },
    { id: uuidv4(), name: "Eggs", amount: 2, unit: "", notes: "large" },
    { id: uuidv4(), name: "Vanilla extract", amount: 2, unit: "tsp", notes: "" },
    { id: uuidv4(), name: "Chocolate chips", amount: 2, unit: "cup", notes: "semi-sweet" },
  ],
  instructions: [
    { id: uuidv4(), step: 1, content: "Preheat oven to 375°F (190°C).", duration: 5 },
    { id: uuidv4(), step: 2, content: "In a medium bowl, whisk together flour, baking soda, and salt.", duration: 2 },
    { id: uuidv4(), step: 3, content: "In a large bowl, cream together butter and both sugars until light and fluffy.", duration: 3 },
    { id: uuidv4(), step: 4, content: "Beat in eggs one at a time, then add vanilla extract.", duration: 2 },
    { id: uuidv4(), step: 5, content: "Gradually mix in the flour mixture until just combined.", duration: 2 },
    { id: uuidv4(), step: 6, content: "Fold in chocolate chips.", duration: 1 },
    { id: uuidv4(), step: 7, content: "Drop rounded tablespoons of dough onto ungreased baking sheets.", duration: 5 },
    { id: uuidv4(), step: 8, content: "Bake for 9-11 minutes or until golden brown around edges.", duration: 10 },
    { id: uuidv4(), step: 9, content: "Cool on baking sheet for 2 minutes, then transfer to wire rack.", duration: 5 },
  ],
  prepTime: 15,
  cookTime: 10,
  servings: 48,
  difficulty: "easy",
  tags: ["dessert", "cookies", "chocolate", "baking"],
  notes: "For extra chewy cookies, slightly underbake them. Store in airtight container for up to 1 week.",
  imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=500&auto=format&fit=crop",
  sourceUrl: "https://example.com/chocolate-chip-cookies",
  authorId: "user-123",
  visibility: "public",
  commentsEnabled: true,
  viewCount: 0,
  likeCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function DemoPage() {
  const [currentView, setCurrentView] = useState<"display" | "form" | "edit" | "import" | "cards">("display");
  const [recipe, setRecipe] = useState<Recipe>(mockRecipe);

  const handleSaveRecipe = async (data: NewRecipeInput) => {
    console.log("Saving recipe:", data);
    // In a real app, this would save to the database
    alert("Recipe saved! (This is a demo)");
  };

  const handleUpdateRecipe = async (data: Partial<NewRecipeInput>) => {
    console.log("Updating recipe:", data);
    // In a real app, this would update the database
    setRecipe(prev => ({ ...prev, ...data, updatedAt: new Date() }));
    setCurrentView("display");
    alert("Recipe updated! (This is a demo)");
  };

  const handleImportRecipe = async (data: NewRecipeInput) => {
    console.log("Importing recipe:", data);
    alert("Recipe imported! (This is a demo)");
  };

  const handlePreviewRecipe = async (url: string): Promise<Recipe | null> => {
    console.log("Previewing recipe from URL:", url);
    // In a real app, this would scrape the URL
    // For demo, return a mock recipe after a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      ...mockRecipe,
      title: "Imported Recipe from " + new URL(url).hostname,
      sourceUrl: url,
    };
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Recipe Management UI Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates all the recipe management UI components built for Jump to Recipe.
        </p>
        
        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={currentView === "display" ? "default" : "outline"}
            onClick={() => setCurrentView("display")}
          >
            Recipe Display
          </Button>
          <Button
            variant={currentView === "form" ? "default" : "outline"}
            onClick={() => setCurrentView("form")}
          >
            Recipe Form
          </Button>
          <Button
            variant={currentView === "edit" ? "default" : "outline"}
            onClick={() => setCurrentView("edit")}
          >
            Recipe Editor
          </Button>
          <Button
            variant={currentView === "import" ? "default" : "outline"}
            onClick={() => setCurrentView("import")}
          >
            Recipe Import
          </Button>
          <Button
            variant={currentView === "cards" ? "default" : "outline"}
            onClick={() => setCurrentView("cards")}
          >
            Recipe Cards
          </Button>
        </div>
      </div>

      {/* Component Demonstrations */}
      {currentView === "display" && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Display Component</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeDisplay
              recipe={recipe}
              onEdit={() => setCurrentView("edit")}
              canEdit={true}
            />
          </CardContent>
        </Card>
      )}

      {currentView === "form" && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Form Component</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeForm
              onSubmit={handleSaveRecipe}
              submitLabel="Save New Recipe"
            />
          </CardContent>
        </Card>
      )}

      {currentView === "edit" && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Editor Component (Inline Editing)</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeEditor
              recipe={recipe}
              onSave={handleUpdateRecipe}
              onCancel={() => setCurrentView("display")}
            />
          </CardContent>
        </Card>
      )}

      {currentView === "import" && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Import Component</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeImportForm
              onImport={handleImportRecipe}
              onPreview={handlePreviewRecipe}
            />
          </CardContent>
        </Card>
      )}

      {currentView === "cards" && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Card Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Standard Recipe Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecipeCard recipe={recipe} />
                <RecipeCard recipe={{
                  ...recipe,
                  title: "Quick Pasta Salad",
                  description: "A refreshing pasta salad perfect for summer gatherings.",
                  difficulty: "medium",
                  tags: ["pasta", "salad", "summer"],
                  imageUrl: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?q=80&w=500&auto=format&fit=crop",
                }} />
                <RecipeCard recipe={{
                  ...recipe,
                  title: "Beef Wellington",
                  description: "An elegant dish featuring tender beef wrapped in puff pastry.",
                  difficulty: "hard",
                  prepTime: 60,
                  cookTime: 45,
                  tags: ["beef", "pastry", "elegant"],
                  imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=500&auto=format&fit=crop",
                }} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Compact Recipe Cards</h3>
              <div className="space-y-2">
                <RecipeCard recipe={recipe} compact={true} />
                <RecipeCard recipe={{
                  ...recipe,
                  title: "Avocado Toast",
                  description: "Simple and healthy breakfast option.",
                  prepTime: 5,
                  cookTime: 0,
                  imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop",
                }} compact={true} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}