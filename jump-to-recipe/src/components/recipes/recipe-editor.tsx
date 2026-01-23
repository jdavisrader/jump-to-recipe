"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Edit, 
  Save, 
  X, 
  Clock, 
  Users, 
  ChefHat,
  ExternalLink 
} from "lucide-react";

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

import { updateRecipeSchema, validateRecipeWithSections } from "@/lib/validations/recipe";
import { normalizeExistingRecipe } from "@/lib/recipe-import-normalizer";
import { RecipeImage } from "./recipe-image";
import { RecipeIngredientsWithSections } from "./recipe-ingredients-with-sections";
import { RecipeInstructionsWithSections } from "./recipe-instructions-with-sections";
import { EmptySectionWarningModal } from "./empty-section-warning-modal";
import { RecipePhotosManager } from "./recipe-photos-manager";
import type { Recipe, NewRecipeInput } from "@/types/recipe";
import type { RecipePhoto } from "@/types/recipe-photos";

interface RecipeEditorProps {
  recipe: Recipe & { photos?: RecipePhoto[] };
  onSave: (data: Partial<NewRecipeInput>, photos?: RecipePhoto[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecipeEditor({ 
  recipe, 
  onSave, 
  onCancel, 
  isLoading = false 
}: RecipeEditorProps) {
  // Normalize existing recipe data for backward compatibility (Requirement 11.1, 11.2, 11.3)
  // This silently fixes invalid data without user intervention
  const normalizedRecipe = useMemo(() => {
    return normalizeExistingRecipe(recipe);
  }, [recipe]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [showEmptySectionWarning, setShowEmptySectionWarning] = useState(false);
  const [emptySections, setEmptySections] = useState<Array<{
    sectionId: string;
    sectionName: string;
    type: 'ingredient' | 'instruction';
  }>>([]);
  const [pendingSubmitData, setPendingSubmitData] = useState<Partial<NewRecipeInput> | null>(null);
  const [photos, setPhotos] = useState<RecipePhoto[]>(recipe.photos || []);

  const form = useForm({
    resolver: zodResolver(updateRecipeSchema),
    defaultValues: {
      title: normalizedRecipe.title,
      description: normalizedRecipe.description || "",
      ingredients: normalizedRecipe.ingredients,
      instructions: normalizedRecipe.instructions,
      ingredientSections: normalizedRecipe.ingredientSections || [],
      instructionSections: normalizedRecipe.instructionSections || [],
      prepTime: normalizedRecipe.prepTime,
      cookTime: normalizedRecipe.cookTime,
      servings: normalizedRecipe.servings,
      difficulty: normalizedRecipe.difficulty,
      tags: normalizedRecipe.tags,
      notes: normalizedRecipe.notes || "",
      imageUrl: normalizedRecipe.imageUrl || "",
      sourceUrl: normalizedRecipe.sourceUrl || "",
      visibility: normalizedRecipe.visibility,
    },
  });

  // Field arrays are now managed by the section components

  const handleSectionEdit = (section: string) => {
    setEditingSection(section);
  };

  const handleSectionSave = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setEditingSection(null);
    }
  };

  const handleSectionCancel = () => {
    setEditingSection(null);
    form.reset();
  };

  const handleSave = async (data: Partial<NewRecipeInput>) => {
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
      await saveRecipe(data);
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  const saveRecipe = async (data: Partial<NewRecipeInput>) => {
    await onSave(data, photos);
  };

  const handleEmptySectionConfirm = async () => {
    if (pendingSubmitData) {
      setShowEmptySectionWarning(false);
      await saveRecipe(pendingSubmitData);
      setPendingSubmitData(null);
      setEmptySections([]);
    }
  };

  const handleEmptySectionCancel = () => {
    setShowEmptySectionWarning(false);
    setPendingSubmitData(null);
    setEmptySections([]);
  };

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

  const totalTime = (form.watch("prepTime") || 0) + (form.watch("cookTime") || 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              {editingSection === "header" ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="text-3xl font-bold border-none p-0 h-auto"
                            placeholder="Recipe title..."
                          />
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
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''}
                            className="text-lg border-none p-0 resize-none"
                            placeholder="Recipe description..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleSectionSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <h1 className="text-3xl font-bold tracking-tight flex-1">
                      {form.watch("title")}
                    </h1>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleSectionEdit("header")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.watch("description") && (
                    <p className="text-lg text-muted-foreground">
                      {form.watch("description")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recipe Image */}
          {editingSection === "image" ? (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="https://example.com/image.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSectionSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <RecipeImage
                  src={form.watch("imageUrl") || ""}
                  alt={form.watch("title") || ""}
                  width={800}
                  height={450}
                  className="object-cover w-full h-full"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleSectionEdit("image")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Recipe Meta */}
          {editingSection === "meta" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
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
                      <FormLabel>Cook Time (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
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
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
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
              </div>

              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSectionSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex gap-4">
                {totalTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{totalTime} min total</span>
                  </div>
                )}
                {form.watch("servings") && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{form.watch("servings")} servings</span>
                  </div>
                )}
                {form.watch("difficulty") && (
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    <span className="capitalize">{form.watch("difficulty")}</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleSectionEdit("meta")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Tags */}
          {editingSection === "tags" ? (
            <div className="space-y-4">
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

              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSectionSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            (form.watch("tags") || []).length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {(form.watch("tags") || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSectionEdit("tags")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )
          )}

          {/* Source Link */}
          {form.watch("sourceUrl") && (
            <div>
              <Button asChild variant="outline" size="sm">
                <a href={form.watch("sourceUrl") || ""} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Recipe
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            {editingSection === "ingredients" ? (
              <div className="space-y-4">
                <RecipeIngredientsWithSections
                  control={form.control}
                  watch={form.watch}
                  errors={form.formState.errors}
                  setError={form.setError}
                  clearErrors={form.clearErrors}
                  isLoading={isLoading}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleSectionSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Ingredients</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSectionEdit("ingredients")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(form.watch("ingredients") || []).map((ingredient) => (
                      <li key={ingredient.id} className="space-y-1">
                        <div className="font-medium">
                          {(ingredient.amount || 0) > 0 && (
                            <span className="text-muted-foreground mr-2">
                              {ingredient.displayAmount || ingredient.amount} {String(ingredient.unit)}
                            </span>
                          )}
                          {ingredient.name}
                        </div>
                        {ingredient.notes && (
                          <div className="text-sm text-muted-foreground ml-2">
                            {ingredient.notes}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            {editingSection === "instructions" ? (
              <div className="space-y-4">
                <RecipeInstructionsWithSections
                  control={form.control}
                  watch={form.watch}
                  errors={form.formState.errors}
                  setError={form.setError}
                  clearErrors={form.clearErrors}
                  isLoading={isLoading}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleSectionSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Instructions</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSectionEdit("instructions")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {(form.watch("instructions") || [])
                      .sort((a, b) => a.step - b.step)
                      .map((instruction) => (
                        <li key={instruction.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {instruction.step}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm leading-relaxed">
                              {instruction.content}
                            </div>
                            {instruction.duration && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {instruction.duration} min
                              </div>
                              )}
                          </div>
                        </li>
                      ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notes</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleSectionEdit("notes")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingSection === "notes" ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes or tips..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleSectionSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {form.watch("notes") || "No notes added yet."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipe Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recipe Photos</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleSectionEdit("photos")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingSection === "photos" ? (
              <div className="space-y-4">
                <RecipePhotosManager
                  recipeId={recipe.id}
                  photos={photos}
                  canEdit={true}
                  onPhotosChange={setPhotos}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleSectionSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleSectionCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <RecipePhotosManager
                recipeId={recipe.id}
                photos={photos}
                canEdit={false}
                onPhotosChange={() => {}} // Read-only mode
              />
            )}
          </CardContent>
        </Card>

        {/* Save/Cancel Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel All Changes
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Recipe"}
          </Button>
        </div>
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