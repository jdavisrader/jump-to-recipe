"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILE_STORAGE_CONFIG } from "@/lib/file-storage-config";
import {
  validatePhotoFile,
  validatePhotoCount,
  getPhotoValidationErrorMessage
} from "@/lib/validations/photo-validation";
import { uploadPhotoWithRetry, preflightPhotoUpload } from "@/lib/photo-upload-retry";
import { getNetworkStatus, setupNetworkMonitoring } from "@/lib/network-utils";
import { toast } from "@/components/ui/use-toast";

interface RecipePhotosUploadProps {
  recipeId: string;
  existingPhotos?: Array<{ id: string; filePath: string; fileName: string }>;
  onPhotosChange: (photos: Array<{ id: string; filePath: string; fileName: string }>) => void;
  disabled?: boolean;
  className?: string;
}

export function RecipePhotosUpload({
  recipeId,
  existingPhotos = [],
  onPhotosChange,
  disabled,
  className,
}: RecipePhotosUploadProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);

  const maxFileSize = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024; // Convert MB to bytes
  const maxFiles = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;

  // Monitor network status
  useEffect(() => {
    const networkStatus = getNetworkStatus();
    setIsOnline(networkStatus.isOnline);

    if (networkStatus.connectionType === 'slow') {
      setConnectionWarning('Slow connection detected. Uploads may take longer.');
    }

    const cleanup = setupNetworkMonitoring((status) => {
      setIsOnline(status.isOnline);

      if (!status.isOnline) {
        setConnectionWarning('No internet connection');
        toast({
          title: "Connection Lost",
          description: "Please check your internet connection",
          variant: "destructive",
        });
      } else if (status.connectionType === 'slow') {
        setConnectionWarning('Slow connection detected');
      } else {
        setConnectionWarning(null);
        if (!isOnline) {
          toast({
            title: "Connection Restored",
            description: "You can now upload photos",
          });
        }
      }
    });

    return cleanup;
  }, [isOnline]);

  const uploadFiles = useCallback(async (files: File[]) => {
    // Validate files before uploading
    const validatedFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validatePhotoFile(file);
      if (validation.isValid) {
        validatedFiles.push(file);
      } else {
        errors.push(validation.error || 'Invalid file');
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join('\n'),
        variant: "destructive",
      });

      if (validatedFiles.length === 0) {
        return;
      }
    }

    // Pre-flight check
    const preflight = await preflightPhotoUpload();
    if (!preflight.canUpload) {
      toast({
        title: "Cannot Upload",
        description: preflight.reason || 'Upload not available',
        variant: "destructive",
      });
      return;
    }

    if (preflight.reason) {
      setConnectionWarning(preflight.reason);
    }

    // Upload files silently in the background
    for (const file of validatedFiles) {
      try {
        // Upload with retry mechanism
        const result = await uploadPhotoWithRetry(
          recipeId,
          file,
          {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            onRetry: (attempt, error) => {
              console.log(`Retry attempt ${attempt} for ${file.name}:`, error.message);
              toast({
                title: "Retrying Upload",
                description: `Attempt ${attempt} for ${file.name}`,
              });
            },
          }
        );

        if (result.success && result.data) {
          // Update parent component with new photos immediately
          const apiResult = result.data as { photos: Array<{ id: string; filePath: string; fileName: string }> };
          const newPhotosList = apiResult.photos.map((photo) => ({
            id: photo.id,
            filePath: photo.filePath,
            fileName: photo.fileName,
          }));

          onPhotosChange([...existingPhotos, ...newPhotosList]);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error("Upload error:", error);

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        toast({
          title: "Upload Failed",
          description: `${file.name}: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  }, [recipeId, existingPhotos, onPhotosChange]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled) return;

      // Check network status
      if (!isOnline) {
        toast({
          title: "No Internet Connection",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
        return;
      }

      // Handle rejected files with detailed error messages
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(({ file, errors }) => {
          const errorMessages = errors.map((e: any) => {
            const friendlyMessage = getPhotoValidationErrorMessage(e.code);
            return `${file.name}: ${friendlyMessage}`;
          });
          return errorMessages.join(' ');
        });

        toast({
          title: "File Validation Error",
          description: errors.join('\n'),
          variant: "destructive",
        });
        return;
      }

      // Validate photo count
      const currentPhotoCount = existingPhotos.length;
      const countValidation = validatePhotoCount(acceptedFiles.length, currentPhotoCount);

      if (!countValidation.isValid) {
        toast({
          title: "Too Many Photos",
          description: countValidation.error,
          variant: "destructive",
        });
        return;
      }

      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
      }
    },
    [disabled, isOnline, existingPhotos.length, uploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"],
    },
    maxSize: maxFileSize,
    disabled: disabled,
    multiple: true,
  });

  const totalPhotos = existingPhotos.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Network Status Warning */}
      {connectionWarning && (
        <div className="flex items-center space-x-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span>{connectionWarning}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400",
          isDragActive && "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
          disabled && "cursor-not-allowed opacity-50",
          !isOnline && "opacity-50 cursor-not-allowed",
          totalPhotos >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {!isOnline
              ? "No internet connection"
              : isDragActive
                ? "Drop the photos here"
                : totalPhotos >= maxFiles
                  ? `Maximum ${maxFiles} photos reached`
                  : "Drag & drop photos here, or click to select"
            }
          </p>
          <p className="text-xs text-gray-400">
            JPEG, PNG, WEBP, HEIC up to {FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB}MB each
          </p>
          <p className="text-xs text-gray-400">
            {totalPhotos}/{maxFiles} photos
          </p>
        </div>
      </div>

    </div>
  );
}