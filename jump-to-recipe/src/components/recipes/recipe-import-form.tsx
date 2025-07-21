"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Upload, Eye, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RecipeDisplay } from "./recipe-display";

import type { Recipe, NewRecipeInput } from "@/types/recipe";

const importSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type ImportFormData = z.infer<typeof importSchema>;

interface RecipeImportFormProps {
  onImport: (data: NewRecipeInput) => Promise<void>;
  onPreview: (url: string) => Promise<Recipe | null>;
  isLoading?: boolean;
}

export function RecipeImportForm({
  onImport,
  onPreview,
  isLoading = false,
}: RecipeImportFormProps) {
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importStep, setImportStep] = useState<"url" | "preview" | "image">("url");

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      url: "",
    },
  });

  const handlePreview = async (data: ImportFormData) => {
    setIsPreviewLoading(true);
    try {
      const recipe = await onPreview(data.url);
      if (recipe) {
        setPreviewRecipe(recipe);
        setImportStep("preview");
      }
    } catch (error) {
      console.error("Error previewing recipe:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewRecipe) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...recipeData } = previewRecipe;
    await onImport(recipeData);
  };

  const handleBack = () => {
    setImportStep("url");
    setPreviewRecipe(null);
    form.reset();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement OCR functionality
      console.log("Image upload:", file);
      // This would integrate with the OCR service
    }
  };

  if (importStep === "preview" && previewRecipe) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recipe Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review the imported recipe details below. You can edit the recipe after importing.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Import Recipe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <RecipeDisplay recipe={previewRecipe} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Import Recipe</h1>
        <p className="text-muted-foreground">
          Import recipes from URLs or upload images to extract recipe data
        </p>
      </div>

      {/* URL Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Import from URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePreview)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/recipe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPreviewLoading} className="w-full">
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Recipe
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import from Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an image of a recipe card or cookbook page. We&apos;ll extract the text and create a recipe for you.
            </p>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center relative overflow-hidden">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Note:</strong> OCR functionality is coming soon. For now, you can manually enter recipes using the recipe form.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Import Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Works best with recipe websites that use structured data (JSON-LD)</li>
            <li>Popular sites like AllRecipes, Food Network, and BBC Good Food are supported</li>
            <li>You can edit all imported recipe details after preview</li>
            <li>Images are imported when available from the source</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}