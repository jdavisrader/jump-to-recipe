"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Users, ChefHat } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createRecipeSchema, validateRecipeWithSections } from "@/lib/validations/recipe";
import type { NewRecipeInput } from "@/types/recipe";
import type { IngredientSection, InstructionSection } from "@/types/sections";
import { RecipeImageUpload } from "@/components/recipes/recipe-image-upload";
import { RecipeIngredientsWithSections } from "@/components/recipes/recipe-ingredients-with-sections";
import { RecipeInstructionsWithSections } from "@/components/recipes/recipe-instructions-with-sections";
import { EmptySectionWarningModal } from "@/components/recipes/empty-section-warning-modal";

// Extended input type to support sections
interface ExtendedRecipeInput extends NewRecipeInput {
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
}

interface RecipeFormProps {
  initialData?: Partial<ExtendedRecipeInput>;
  onSubmit: (data: NewRecipeInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function RecipeForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Recipe",
}: RecipeFormProps) {
  const form = useForm({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      ingredients: initialData?.ingredients || [
        { id: uuidv4(), name: "", amount: 0, unit: "", notes: "" },
      ],
      instructions: initialData?.instructions || [
        { id: uuidv4(), step: 1, content: "", duration: undefined },
      ],
      ingredientSections: initialData?.ingredientSections || [],
      instructionSections: initialData?.instructionSections || [],
      prepTime: initialData?.prepTime || undefined,
      cookTime: initialData?.cookTime || undefined,
      servings: initialData?.servings || undefined,
      difficulty: initialData?.difficulty || undefined,
      tags: initialData?.tags || [],
      notes: initialData?.notes || "",
      imageUrl: initialData?.imageUrl || "",
      sourceUrl: initialData?.sourceUrl || "",
      authorId: initialData?.authorId || "",
      visibility: initialData?.visibility || "private",
    },
  });

  // Field arrays are now managed by the section components
  // Keep these for backward compatibility but they're handled internally

  const [tagInput, setTagInput] = useState("");
  const [showEmptySectionWarning, setShowEmptySectionWarning] = useState(false);
  const [emptySections, setEmptySections] = useState<Array<{
    sectionId: string;
    sectionName: string;
    type: 'ingredient' | 'instruction';
  }>>([]);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleSubmit = async (data: any) => {
    try {
      // Validate the recipe with sections
      const validationResult = validateRecipeWithSections(data);
      
      // Show warning for empty sections if any exist
      if (validationResult.warnings.emptySections.length > 0) {
        setEmptySections(validationResult.warnings.emptySections);
        setPendingSubmitData(data);
        setShowEmptySectionWarning(true);
        return;
      }

      // If no empty sections, proceed with submission
      await submitRecipe(data);
    } catch (error) {
      console.error("Error submitting recipe:", error);
    }
  };

  const submitRecipe = async (data: any) => {
    // Convert form data to match NewRecipeInput type
    const recipeData: NewRecipeInput = {
      ...data,
      description: data.description || null,
      difficulty: data.difficulty || null,
      prepTime: data.prepTime || null,
      cookTime: data.cookTime || null,
      servings: data.servings || null,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      sourceUrl: data.sourceUrl || null,
      authorId: data.authorId || null,
    };
    
    await onSubmit(recipeData);
  };

  const handleEmptySectionConfirm = async () => {
    if (pendingSubmitData) {
      setShowEmptySectionWarning(false);
      await submitRecipe(pendingSubmitData);
      setPendingSubmitData(null);
      setEmptySections([]);
    }
  };

  const handleEmptySectionCancel = () => {
    setShowEmptySectionWarning(false);
    setPendingSubmitData(null);
    setEmptySections([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter recipe title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the recipe..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Prep Time (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="15"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cookTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Cook Time (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Servings
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Difficulty
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ingredients with Sections */}
        <RecipeIngredientsWithSections
          control={form.control as any}
          watch={form.watch as any}
          errors={form.formState.errors as any}
          setError={form.setError as any}
          clearErrors={form.clearErrors as any}
          isLoading={isLoading}
        />

        {/* Instructions with Sections */}
        <RecipeInstructionsWithSections
          control={form.control as any}
          watch={form.watch as any}
          errors={form.formState.errors as any}
          setError={form.setError as any}
          clearErrors={form.clearErrors as any}
          isLoading={isLoading}
        />

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(form.watch("tags") || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or tips..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/recipe"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </form>

      <EmptySectionWarningModal
        isOpen={showEmptySectionWarning}
        onClose={handleEmptySectionCancel}
        onConfirm={handleEmptySectionConfirm}
        emptySections={emptySections}
        isLoading={isLoading}
      />
    </Form>
  );
}