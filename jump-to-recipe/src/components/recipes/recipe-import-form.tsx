"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Upload, Eye, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
import { 
  normalizeImportedRecipe, 
  createNormalizationSummary, 
  formatNormalizationSummary,
  type NormalizationSummary 
} from "@/lib/recipe-import-normalizer";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";

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
  const [normalizedRecipe, setNormalizedRecipe] = useState<NewRecipeInput | null>(null);
  const [normalizationSummary, setNormalizationSummary] = useState<NormalizationSummary | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importStep, setImportStep] = useState<"url" | "preview" | "image">("url");
  const { validate, isValid, errorSummary } = useRecipeValidation();

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
        // Create normalization summary to track changes
        const summary = createNormalizationSummary();
        
        // Apply normalization to imported recipe data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...recipeData } = recipe;
        const normalized = normalizeImportedRecipe(recipeData, summary);
        
        // Validate normalized data
        const validationResult = validate(normalized);
        
        // Store both preview and normalized versions
        setPreviewRecipe(recipe);
        setNormalizedRecipe(normalized);
        setNormalizationSummary(summary);
        
        // Only proceed to preview if validation passes or has minor issues
        // Major validation errors will be shown in the preview step
        setImportStep("preview");
      }
    } catch (error) {
      console.error("Error previewing recipe:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!normalizedRecipe) return;

    // Final validation check before import
    const validationResult = validate(normalizedRecipe);
    
    if (!validationResult) {
      // Validation failed - errors are already displayed
      return;
    }

    // Import the normalized recipe
    await onImport(normalizedRecipe);
  };

  const handleBack = () => {
    setImportStep("url");
    setPreviewRecipe(null);
    setNormalizedRecipe(null);
    setNormalizationSummary(null);
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
    // Check if there are any normalization changes
    const hasNormalizationChanges = normalizationSummary && (
      normalizationSummary.sectionsRenamed > 0 ||
      normalizationSummary.sectionsFlattened > 0 ||
      normalizationSummary.itemsDropped > 0 ||
      normalizationSummary.idsGenerated > 0 ||
      normalizationSummary.positionsAssigned > 0
    );

    // Check for validation errors
    const hasValidationErrors = !isValid && errorSummary && errorSummary.count > 0;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recipe Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the imported recipe details below. You can edit the recipe after importing.
            </p>

            {/* Normalization Summary */}
            {hasNormalizationChanges && normalizationSummary && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Recipe Data Normalized
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {formatNormalizationSummary(normalizationSummary)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      These changes ensure the recipe meets our data quality standards.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {hasValidationErrors && errorSummary && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Validation Issues Found
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      {errorSummary.count} validation error{errorSummary.count > 1 ? 's' : ''} must be fixed before importing:
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                      {errorSummary.types.map((errorType, index) => (
                        <li key={index}>{errorType}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Please go back and try a different recipe URL, or contact support if this issue persists.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No Issues */}
            {!hasNormalizationChanges && !hasValidationErrors && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Recipe Ready to Import
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      No changes needed. The recipe data is valid and ready to be imported.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || hasValidationErrors}
                title={hasValidationErrors ? "Fix validation errors before importing" : "Import this recipe"}
              >
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

        <RecipeDisplay recipe={previewRecipe} showComments={false} />
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