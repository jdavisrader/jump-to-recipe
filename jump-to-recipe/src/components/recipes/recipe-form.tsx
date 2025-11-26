"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Users, ChefHat, X } from "lucide-react";
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

interface RecipeFormProps {
  initialData?: Partial<ExtendedRecipeInput>;
  onSubmit: (data: NewRecipeInput, photos?: RecipePhoto[]) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  recipeId?: string; // For editing existing recipes with photos
}

export function RecipeForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Recipe",
  recipeId,
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
  const [photos, setPhotos] = useState<TempRecipePhoto[]>(initialData?.photos || []);

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