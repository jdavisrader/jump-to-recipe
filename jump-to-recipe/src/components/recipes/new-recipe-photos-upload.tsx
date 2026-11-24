"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecipePhoto } from "@/types/recipe-photos";

// RecipePhoto plus the local file, uploaded once the recipe exists
export interface TempRecipePhoto extends RecipePhoto {
  _tempFile?: File;
}

// Holds original-recipe photos for a recipe that doesn't exist yet; they upload after it is created
interface NewRecipePhotosUploadProps {
  photos: TempRecipePhoto[];
  onPhotosChange: (photos: TempRecipePhoto[]) => void;
  disabled?: boolean;
}

export function NewRecipePhotosUpload({ photos, onPhotosChange, disabled }: NewRecipePhotosUploadProps) {
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
          "border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors hover:border-muted-foreground",
          isDragActive && "border-primary bg-accent/30",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-foreground">
            {isDragActive
              ? "Drop the photos here..."
              : "Drag & drop photos here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WEBP, HEIC up to 10MB each
          </p>
          <p className="text-xs text-muted-foreground">
            {photos.length}/{maxFiles} photos
          </p>
        </div>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
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
    </div>
  );
}
