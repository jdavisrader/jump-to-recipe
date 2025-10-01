"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  category: "recipes" | "cookbooks" | "avatars";
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ImageUpload({
  category,
  value,
  onChange,
  onRemove,
  disabled,
  className,
  placeholder = "Upload an image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.file?.url) {
        onChange(result.file.url);
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error("Upload error:", error);
      // You might want to show a toast notification here
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [category, onChange]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        uploadFile(acceptedFiles[0]);
      }
    },
    [disabled, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024, // 4MB
    disabled: disabled || isUploading,
  });

  const loading = isUploading;

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          {onRemove && !disabled && (
            <Button
              type="button"
              onClick={onRemove}
              variant="destructive"
              size="sm"
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400",
        isDragActive && "border-blue-400 bg-blue-50",
        loading && "opacity-50 cursor-not-allowed",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive ? "Drop the image here" : placeholder}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF up to 4MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}