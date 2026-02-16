"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Users, ChefHat, X, AlertCircle } from "lucide-react";
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
import { normalizeExistingRecipe } from "@/lib/recipe-import-normalizer";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";
import type { NewRecipeInput } from "@/types/recipe";
import type { IngredientSection, InstructionSection } from "@/types/sections";
import type { RecipePhoto } from "@/types/recipe-photos";

// Extended RecipePhoto type for new recipe uploads
interface TempRecipePhoto extends RecipePhoto {
  _tempFile?: File;
}
import { RecipeImageUpload } from "@/components/recipes/recipe-image-upload";
import { RecipeIngredientsWithSections } from "@/components/recipes/recipe-ingredients-with-sections";
import { RecipeInstructionsWithSections } from "@/components/recipes/recipe-instructions-with-sections";
import { EmptySectionWarningModal } from "@/components/recipes/empty-section-warning-modal";
import { RecipePhotosManager } from "@/components/recipes/recipe-photos-manager";
import { RecipePhotosUpload } from "@/components/recipes/recipe-photos-upload";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Extended input type to support sections and photos
interface ExtendedRecipeInput extends NewRecipeInput {
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
  photos?: RecipePhoto[];
}

/**
 * Props for the RecipeForm component.
 */
interface RecipeFormProps {
  /** 
   * Initial data to populate the form.
   * When editing an existing recipe, this data is automatically normalized
   * to fix any legacy data issues (see Requirement 11.1-11.5).
   */
  initialData?: Partial<ExtendedRecipeInput>;
  
  /** 
   * Callback when the form is submitted.
   * Called after all validation passes and user confirms any warnings.
   * 
   * @param data - The validated recipe data
   * @param photos - Optional array of recipe photos (for new recipes or edits)
   */
  onSubmit: (data: NewRecipeInput, photos?: RecipePhoto[]) => Promise<void>;
  
  /** 
   * Whether the form is in a loading/submitting state.
   * When true, disables form inputs and shows loading indicators.
   */
  isLoading?: boolean;
  
  /** 
   * Custom label for the submit button.
   * Defaults to "Save Recipe".
   */
  submitLabel?: string;
  
  /** 
   * ID of the recipe being edited (for existing recipes).
   * When provided, enables photo management for the existing recipe.
   * Also triggers normalization of initial data for backward compatibility.
   */
  recipeId?: string;
  
  /** 
   * Content to render before the submit button.
   * Useful for adding custom actions or information at the bottom of the form.
   */
  beforeSubmit?: React.ReactNode;
}

/**
 * RecipeForm - Comprehensive form component for creating and editing recipes with section support.
 * 
 * This component provides a full-featured recipe editing experience with:
 * - Basic recipe information (title, description, times, servings, difficulty)
 * - Sectioned ingredients and instructions
 * - Recipe photos (main image and original recipe photos)
 * - Tags management
 * - Real-time validation with inline error display
 * - Backward compatibility with existing recipes
 * 
 * ## Validation Features
 * 
 * The form integrates with the validation system to provide comprehensive feedback:
 * 
 * ### Client-Side Validation
 * - **Real-time**: Validates on blur and before submission
 * - **Inline Errors**: Shows errors next to invalid fields
 * - **Error Summary**: Displays banner with error count and types
 * - **Save Button**: Disabled when validation fails with tooltip explanation
 * - **Focus Management**: Moves focus to first invalid field on submit
 * 
 * ### Validation Flow
 * 1. User fills out form
 * 2. Validation runs on blur (optional) or submit (required)
 * 3. If invalid: Show errors, disable save, focus first error
 * 4. If valid: Check for empty section warnings
 * 5. If warnings: Show confirmation modal
 * 6. If confirmed or no warnings: Submit to server
 * 
 * ### Error Display Levels
 * - **Form Level**: Error summary banner at top
 * - **Section Level**: Errors in section headers and containers
 * - **Field Level**: Inline errors below individual fields
 * 
 * ## Backward Compatibility
 * 
 * The form automatically normalizes existing recipe data (Requirement 11.1-11.5):
 * 
 * - **On Load**: Applies normalization when `recipeId` is provided
 * - **Silent Fixes**: Corrects invalid data without user intervention
 * - **Display**: Shows normalized data in form fields
 * - **On Save**: Persists corrected data to database
 * 
 * ### Normalization Process
 * - Assigns missing section names
 * - Flattens empty sections
 * - Auto-assigns missing positions
 * - Drops empty items
 * - Generates missing UUIDs
 * 
 * ## Empty Section Warnings
 * 
 * The form warns users about empty sections before saving:
 * 
 * - **Detection**: Identifies sections with no items
 * - **Modal**: Shows confirmation dialog listing empty sections
 * - **Options**: User can cancel to fix or confirm to save anyway
 * - **Bypass**: Validation errors must be fixed first
 * 
 * ## Accessibility
 * 
 * The form follows WCAG 2.1 AA guidelines:
 * 
 * - **ARIA Live Regions**: Announces validation state changes
 * - **Field Association**: Links errors to fields with aria-describedby
 * - **Invalid State**: Marks invalid fields with aria-invalid
 * - **Focus Management**: Moves focus to first error on submit
 * - **Screen Reader Support**: All errors are announced
 * - **Keyboard Navigation**: Full keyboard support
 * 
 * ## Usage Examples
 * 
 * ### Creating a New Recipe
 * 
 * @example
 * ```tsx
 * function NewRecipePage() {
 *   const handleSubmit = async (data: NewRecipeInput, photos?: RecipePhoto[]) => {
 *     const recipe = await createRecipe(data);
 *     if (photos) {
 *       await uploadPhotos(recipe.id, photos);
 *     }
 *     router.push(`/recipes/${recipe.id}`);
 *   };
 *   
 *   return (
 *     <RecipeForm
 *       onSubmit={handleSubmit}
 *       submitLabel="Create Recipe"
 *     />
 *   );
 * }
 * ```
 * 
 * ### Editing an Existing Recipe
 * 
 * @example
 * ```tsx
 * function EditRecipePage({ recipeId }: { recipeId: string }) {
 *   const recipe = await loadRecipe(recipeId);
 *   
 *   const handleSubmit = async (data: NewRecipeInput, photos?: RecipePhoto[]) => {
 *     await updateRecipe(recipeId, data);
 *     if (photos) {
 *       await updatePhotos(recipeId, photos);
 *     }
 *     router.push(`/recipes/${recipeId}`);
 *   };
 *   
 *   return (
 *     <RecipeForm
 *       recipeId={recipeId}
 *       initialData={recipe}
 *       onSubmit={handleSubmit}
 *       submitLabel="Update Recipe"
 *     />
 *   );
 * }
 * ```
 * 
 * ### With Custom Actions
 * 
 * @example
 * ```tsx
 * <RecipeForm
 *   initialData={recipe}
 *   onSubmit={handleSubmit}
 *   beforeSubmit={
 *     <div className="flex gap-2">
 *       <Button variant="outline" onClick={handlePreview}>
 *         Preview
 *       </Button>
 *       <Button variant="destructive" onClick={handleDelete}>
 *         Delete Recipe
 *       </Button>
 *     </div>
 *   }
 * />
 * ```
 * 
 * ## Form Structure
 * 
 * The form is organized into the following sections:
 * 
 * 1. **Basic Information**: Title, description, times, servings, difficulty
 * 2. **Ingredients**: Sectioned ingredient list with validation
 * 3. **Instructions**: Sectioned instruction list with validation
 * 4. **Tags**: Keyword tags for categorization
 * 5. **Additional Information**: Notes, source URL, main image, visibility
 * 6. **Original Photos**: Photo gallery for recipe documentation
 * 
 * ## Validation Requirements
 * 
 * The form enforces the following validation rules:
 * 
 * - **Section Names**: Required, non-empty, no whitespace-only (Req 1.1-1.5)
 * - **Section Items**: Minimum 1 item per section (Req 2.1-2.5)
 * - **Recipe Ingredients**: At least one ingredient required (Req 3.1-3.5)
 * - **Item Text**: Required, non-empty, no whitespace-only (Req 4.1-4.5)
 * - **IDs**: Valid UUID v4 format
 * - **Positions**: Non-negative integers
 * 
 * ## Related Components
 * 
 * @see {@link RecipeIngredientsWithSections} for ingredient section management
 * @see {@link RecipeInstructionsWithSections} for instruction section management
 * @see {@link useRecipeValidation} for the validation hook
 * @see {@link EmptySectionWarningModal} for empty section warnings
 * @see {@link RecipePhotosManager} for photo management
 */
export function RecipeForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Recipe",
  recipeId,
  beforeSubmit,
}: RecipeFormProps) {
  // Normalize initial data for backward compatibility (Requirement 11.1, 11.2, 11.3)
  // This silently fixes invalid data when editing existing recipes
  const normalizedInitialData = useMemo(() => {
    if (!initialData) return undefined;
    
    // Only normalize if we have recipe data (editing mode)
    // For new recipes, use the data as-is
    if (recipeId) {
      return normalizeExistingRecipe(initialData);
    }
    
    return initialData;
  }, [initialData, recipeId]);

  const form = useForm({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: normalizedInitialData?.title || "",
      description: normalizedInitialData?.description || "",
      ingredients: normalizedInitialData?.ingredients || [
        { id: uuidv4(), name: "", amount: 0, unit: "", notes: "" },
      ],
      instructions: normalizedInitialData?.instructions || [
        { id: uuidv4(), step: 1, content: "", duration: undefined },
      ],
      ingredientSections: normalizedInitialData?.ingredientSections || [],
      instructionSections: normalizedInitialData?.instructionSections || [],
      prepTime: normalizedInitialData?.prepTime || undefined,
      cookTime: normalizedInitialData?.cookTime || undefined,
      servings: normalizedInitialData?.servings || undefined,
      difficulty: normalizedInitialData?.difficulty || undefined,
      tags: normalizedInitialData?.tags || [],
      notes: normalizedInitialData?.notes || "",
      imageUrl: normalizedInitialData?.imageUrl || "",
      sourceUrl: normalizedInitialData?.sourceUrl || "",
      visibility: normalizedInitialData?.visibility || "private",
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
  const [photos, setPhotos] = useState<TempRecipePhoto[]>(initialData?.photos || []);

  // Initialize validation hook
  const { validate, getFieldError, isValid, errors, errorSummary } = useRecipeValidation();
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  
  // Ref for the first invalid field to manage focus
  const firstInvalidFieldRef = useState<HTMLElement | null>(null);

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

  // Validation handler that can be called on blur or manually
  const handleValidation = useCallback(() => {
    const formData = form.getValues();
    
    // Debug logging
    console.log('Validating form data:', {
      hasIngredients: formData.ingredients?.length > 0,
      hasIngredientSections: formData.ingredientSections?.length > 0,
      ingredientSectionItemCount: formData.ingredientSections?.reduce((total: number, section: any) => total + section.items.length, 0) ?? 0,
      hasInstructions: formData.instructions?.length > 0,
      hasInstructionSections: formData.instructionSections?.length > 0,
      instructionSectionItemCount: formData.instructionSections?.reduce((total: number, section: any) => total + section.items.length, 0) ?? 0,
    });
    
    const isFormValid = validate(formData);
    
    console.log('Validation result:', isFormValid, 'Errors:', errors);
    
    // Update validation errors map for section components
    const errorsMap = new Map<string, string>();
    errors.forEach(error => {
      const key = error.path.join('.');
      errorsMap.set(key, error.message);
    });
    setValidationErrors(errorsMap);
    
    return isFormValid;
  }, [form, validate, errors]);

  // Clear validation errors when user fixes fields
  const handleFieldChange = useCallback(() => {
    // Re-validate on change to clear errors
    if (validationErrors.size > 0) {
      handleValidation();
    }
  }, [validationErrors, handleValidation]);

  const handleSubmit = async (data: any) => {
    try {
      // Run strict validation before submission
      const isFormValid = handleValidation();
      
      console.log('handleSubmit - isFormValid:', isFormValid, 'isValid from hook:', isValid);
      
      if (!isFormValid) {
        // Validation failed, errors are already displayed
        // Move focus to the first invalid field
        setTimeout(() => {
          const firstInvalidField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
          if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }

      // Validate the recipe with sections (for empty section warnings)
      const validationResult = validateRecipeWithSections(data);
      
      console.log('Empty sections check:', validationResult.warnings.emptySections);
      
      // Show warning for empty sections if any exist
      if (validationResult.warnings.emptySections.length > 0) {
        setEmptySections(validationResult.warnings.emptySections);
        setPendingSubmitData(data);
        setShowEmptySectionWarning(true);
        return;
      }

      // If no empty sections, proceed with submission
      console.log('Proceeding to submitRecipe');
      await submitRecipe(data);
    } catch (error) {
      console.error("Error submitting recipe:", error);
    }
  };

  const submitRecipe = async (data: any) => {
    // Ensure positions are assigned to all ingredients in sections
    const processedData = { ...data };
    
    console.log('submitRecipe - Raw data:', {
      hasIngredients: data.ingredients?.length,
      hasIngredientSections: data.ingredientSections?.length,
      hasInstructions: data.instructions?.length,
      hasInstructionSections: data.instructionSections?.length,
    });
    
    // Determine which mode we're in for each type
    const hasIngredientSections = processedData.ingredientSections && processedData.ingredientSections.length > 0;
    const hasInstructionSections = processedData.instructionSections && processedData.instructionSections.length > 0;
    
    console.log('submitRecipe - Mode detection:', { 
      hasIngredientSections, 
      hasInstructionSections 
    });
    
    // CRITICAL: Always clear flat arrays when sections exist to prevent duplication
    // This ensures the backend only receives ONE source of truth
    if (hasIngredientSections) {
      console.log('Clearing flat ingredients array (sections exist)');
      processedData.ingredients = [];
      
      // Process ingredient sections
      processedData.ingredientSections = processedData.ingredientSections.map((section: any) => ({
        ...section,
        items: section.items.map((item: any, index: number) => ({
          ...item,
          position: typeof item.position === 'number' ? item.position : index,
        })),
      }));
    } else {
      // No sections - ensure sections array is empty
      processedData.ingredientSections = [];
    }
    
    if (hasInstructionSections) {
      console.log('Clearing flat instructions array (sections exist)');
      processedData.instructions = [];
      
      // Process instruction sections
      processedData.instructionSections = processedData.instructionSections.map((section: any) => ({
        ...section,
        items: section.items.map((item: any, index: number) => ({
          ...item,
          position: typeof item.position === 'number' ? item.position : index,
        })),
      }));
    } else {
      // No sections - ensure sections array is empty
      processedData.instructionSections = [];
    }
    
    console.log('submitRecipe - Processed data before sending:', {
      ingredientsLength: processedData.ingredients?.length,
      ingredientSectionsLength: processedData.ingredientSections?.length,
      instructionsLength: processedData.instructions?.length,
      instructionSectionsLength: processedData.instructionSections?.length,
    });
    
    // Convert form data to match NewRecipeInput type
    const recipeData: NewRecipeInput = {
      ...processedData,
      description: processedData.description || null,
      difficulty: processedData.difficulty || null,
      prepTime: processedData.prepTime || null,
      cookTime: processedData.cookTime || null,
      servings: processedData.servings || null,
      notes: processedData.notes || null,
      imageUrl: processedData.imageUrl || null,
      sourceUrl: processedData.sourceUrl || null,
    };
    
    console.log('submitRecipe - Final recipe data to send:', recipeData);
    
    await onSubmit(recipeData, photos);
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
        {/* ARIA Live Region for Validation Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {errorSummary && errorSummary.count > 0 && (
            `${errorSummary.count} validation ${errorSummary.count === 1 ? 'error' : 'errors'} found. Please review and fix the errors before saving.`
          )}
          {isValid && validationErrors.size === 0 && (
            'All validation errors have been resolved.'
          )}
        </div>

        {/* Validation Error Summary Banner */}
        {errorSummary && errorSummary.count > 0 && (
          <div 
            className="error-summary bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
            role="alert"
            aria-labelledby="error-summary-title"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h3 id="error-summary-title" className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  {errorSummary.count} validation {errorSummary.count === 1 ? 'error' : 'errors'} must be fixed before saving
                </h3>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                  {errorSummary.types.map((errorType, index) => (
                    <li key={index}>{errorType}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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
          validationErrors={validationErrors}
          onValidate={handleValidation}
          onFieldChange={handleFieldChange}
        />

        {/* Instructions with Sections */}
        <RecipeInstructionsWithSections
          control={form.control as any}
          watch={form.watch as any}
          errors={form.formState.errors as any}
          setError={form.setError as any}
          clearErrors={form.clearErrors as any}
          isLoading={isLoading}
          validationErrors={validationErrors}
          onValidate={handleValidation}
          onFieldChange={handleFieldChange}
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

        {/* Original Recipe Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Original Recipe Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {recipeId ? (
              <RecipePhotosManager
                recipeId={recipeId}
                photos={photos}
                canEdit={true}
                onPhotosChange={setPhotos}
              />
            ) : (
              <NewRecipePhotosUpload
                photos={photos}
                onPhotosChange={setPhotos}
                disabled={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Additional content before submit button */}
        {beforeSubmit}

        {/* Submit Button with Validation State */}
        <div className="relative">
          <Button 
            type="submit" 
            disabled={isLoading || !isValid} 
            className="w-full"
            title={!isValid ? `Cannot save: ${errorSummary?.count || 0} validation ${errorSummary?.count === 1 ? 'error' : 'errors'}` : undefined}
            onClick={() => console.log('Button clicked - isValid:', isValid, 'isLoading:', isLoading, 'disabled:', isLoading || !isValid)}
          >
            {isLoading ? "Saving..." : submitLabel}
          </Button>
          {!isValid && !isLoading && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
              Please fix validation errors before saving
            </p>
          )}
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

// Component for handling photo uploads for new recipes (before recipe is created)
interface NewRecipePhotosUploadProps {
  photos: TempRecipePhoto[];
  onPhotosChange: (photos: TempRecipePhoto[]) => void;
  disabled?: boolean;
}

function NewRecipePhotosUpload({ photos, onPhotosChange, disabled }: NewRecipePhotosUploadProps) {
  const maxFiles = 10;
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    // Clear any previous errors
    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(({ file, errors }) => {
        const errorMsg = errors.map((e: any) => {
          if (e.code === 'file-too-large') {
            return `${file.name} is too large (max 10MB)`;
          }
          if (e.code === 'file-invalid-type') {
            return `${file.name} is not a supported image format`;
          }
          return e.message;
        }).join(', ');
        return errorMsg;
      });
      setError(errorMessages.join('; '));
      return;
    }

    const totalPhotos = photos.length + acceptedFiles.length;
    if (totalPhotos > maxFiles) {
      setError(`You can only upload up to ${maxFiles} photos. You currently have ${photos.length} photos.`);
      return;
    }

    // Create photo objects with preview URLs
    const newPhotos: TempRecipePhoto[] = acceptedFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      recipeId: "temp-new-recipe",
      filePath: URL.createObjectURL(file), // Use object URL for preview
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      position: photos.length + index,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store the actual file for later upload
      _tempFile: file,
    }));

    onPhotosChange([...photos, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic']
    },
    maxSize: maxFileSize,
    disabled,
  });

  const removePhoto = (photoId: string) => {
    const photoToRemove = photos.find(p => p.id === photoId);
    if (photoToRemove && photoToRemove.filePath.startsWith('blob:')) {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(photoToRemove.filePath);
    }
    onPhotosChange(photos.filter(p => p.id !== photoId));
  };

  const clearAllPhotos = () => {
    // Revoke all object URLs to free memory
    photos.forEach(photo => {
      if (photo.filePath.startsWith('blob:')) {
        URL.revokeObjectURL(photo.filePath);
      }
    });
    onPhotosChange([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload photos of the original recipe to help preserve the visual details and presentation.
      </p>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors hover:border-gray-400",
          isDragActive && "border-blue-400 bg-blue-50",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isDragActive
              ? "Drop the photos here..."
              : "Drag & drop photos here, or click to select"}
          </p>
          <p className="text-xs text-gray-400">
            JPEG, PNG, WEBP, HEIC up to 10MB each
          </p>
          <p className="text-xs text-gray-400">
            {photos.length}/{maxFiles} photos
          </p>
        </div>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Recipe Photos</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllPhotos}
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <img
                    src={photo.filePath}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                  />

                  {/* Delete Button */}
                  <Button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    aria-label={`Delete photo ${photo.fileName}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Position Indicator */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <div className="text-lg font-medium mb-2">No photos yet</div>
            <div className="text-sm">
              Upload photos to showcase your recipe visually
            </div>
          </div>
        </div>
      )}
    </div>
  );
}