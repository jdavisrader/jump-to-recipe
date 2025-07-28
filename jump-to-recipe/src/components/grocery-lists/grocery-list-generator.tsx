"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeSelector } from "./recipe-selector";
import { ServingSizeAdjuster } from "./serving-size-adjuster";
import { GroceryListDisplay } from "./grocery-list-display";
import type { Recipe } from "@/types/recipe";
import type { GroceryList, GroceryItem } from "@/types/grocery-list";

interface GroceryListGeneratorProps {
  onListGenerated?: (groceryList: GroceryList) => void;
}

type GeneratorStep = "select-recipes" | "adjust-servings" | "preview-list" | "generated";

export function GroceryListGenerator({ onListGenerated }: GroceryListGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<GeneratorStep>("select-recipes");
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [servingAdjustments, setServingAdjustments] = useState<Record<string, number>>({});
  const [groceryListTitle, setGroceryListTitle] = useState("");
  const [previewList, setPreviewList] = useState<GroceryList | null>(null);
  const [generatedList, setGeneratedList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecipeToggle = (recipe: Recipe) => {
    setSelectedRecipes(prev => {
      const isSelected = prev.some(r => r.id === recipe.id);
      if (isSelected) {
        // Remove recipe and its serving adjustment
        const newAdjustments = { ...servingAdjustments };
        delete newAdjustments[recipe.id];
        setServingAdjustments(newAdjustments);
        return prev.filter(r => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const handleServingChange = (recipeId: string, newServings: number) => {
    setServingAdjustments(prev => ({
      ...prev,
      [recipeId]: newServings,
    }));
  };

  const generatePreview = async () => {
    if (selectedRecipes.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/grocery-list/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeIds: selectedRecipes.map(r => r.id),
          servingAdjustments,
          title: groceryListTitle || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate grocery list");
      }

      const groceryList = await response.json();
      setPreviewList(groceryList);
      setCurrentStep("preview-list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate grocery list");
    } finally {
      setLoading(false);
    }
  };

  const saveGroceryList = async () => {
    if (!previewList) return;

    setLoading(true);
    setError(null);

    try {
      // The list is already saved when generated, so we just need to update the state
      setGeneratedList(previewList);
      setCurrentStep("generated");
      onListGenerated?.(previewList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grocery list");
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    if (!previewList) return;

    const updatedItems = previewList.items.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    setPreviewList({
      ...previewList,
      items: updatedItems,
    });
  };

  const handleItemUpdate = (itemId: string, updates: Partial<GroceryItem>) => {
    if (!previewList) return;

    const updatedItems = previewList.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    setPreviewList({
      ...previewList,
      items: updatedItems,
    });
  };

  const handleItemDelete = (itemId: string) => {
    if (!previewList) return;

    const updatedItems = previewList.items.filter(item => item.id !== itemId);

    setPreviewList({
      ...previewList,
      items: updatedItems,
    });
  };

  const resetGenerator = () => {
    setCurrentStep("select-recipes");
    setSelectedRecipes([]);
    setServingAdjustments({});
    setGroceryListTitle("");
    setPreviewList(null);
    setGeneratedList(null);
    setError(null);
  };



  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Generate Grocery List
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={currentStep === "select-recipes" ? "text-primary font-medium" : ""}>
              1. Select Recipes
            </span>
            <span>→</span>
            <span className={currentStep === "adjust-servings" ? "text-primary font-medium" : ""}>
              2. Adjust Servings
            </span>
            <span>→</span>
            <span className={currentStep === "preview-list" ? "text-primary font-medium" : ""}>
              3. Preview & Edit
            </span>
            <span>→</span>
            <span className={currentStep === "generated" ? "text-primary font-medium" : ""}>
              4. Complete
            </span>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Step content */}
      {currentStep === "select-recipes" && (
        <RecipeSelector
          selectedRecipes={selectedRecipes}
          onRecipeToggle={handleRecipeToggle}
          onSelectionComplete={() => setCurrentStep("adjust-servings")}
        />
      )}

      {currentStep === "adjust-servings" && (
        <div className="space-y-4">
          <ServingSizeAdjuster
            recipes={selectedRecipes}
            servingAdjustments={servingAdjustments}
            onServingChange={handleServingChange}
          />

          <Card>
            <CardHeader>
              <CardTitle>Grocery List Title (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter a custom title for your grocery list..."
                value={groceryListTitle}
                onChange={(e) => setGroceryListTitle(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("select-recipes")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipe Selection
            </Button>
            <Button
              onClick={generatePreview}
              disabled={loading || selectedRecipes.length === 0}
            >
              {loading ? "Generating..." : "Generate Grocery List"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === "preview-list" && previewList && (
        <div className="space-y-4">
          <GroceryListDisplay
            groceryList={previewList}
            onItemToggle={handleItemToggle}
            onItemUpdate={handleItemUpdate}
            onItemDelete={handleItemDelete}
            editable={true}
          />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("adjust-servings")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Adjustments
            </Button>
            <Button
              onClick={saveGroceryList}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Grocery List"}
            </Button>
          </div>
        </div>
      )}

      {currentStep === "generated" && generatedList && (
        <div className="space-y-4">
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-primary font-medium">
                  ✓ Grocery list generated successfully!
                </div>
                <div className="text-sm text-muted-foreground">
                  Your grocery list has been saved and is ready to use.
                </div>
              </div>
            </CardContent>
          </Card>

          <GroceryListDisplay
            groceryList={generatedList}
            onItemToggle={() => {}} // Read-only in this view
            onItemUpdate={() => {}} // Read-only in this view
            onItemDelete={() => {}} // Read-only in this view
            editable={false}
          />

          <div className="flex justify-center">
            <Button onClick={resetGenerator}>
              Generate Another List
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}