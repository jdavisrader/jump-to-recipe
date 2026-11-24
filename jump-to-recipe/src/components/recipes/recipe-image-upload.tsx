"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { downscaleImageForUpload } from "@/lib/downscale-image";

// Matches ImageUpload's picker limit; larger phone photos are downscaled before upload
const MAX_SELECTABLE_SIZE_MB = 10;

interface RecipeImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function RecipeImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
}: RecipeImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Same upload path ImageUpload uses for covers
  const replaceCover = async (file: File) => {
    if (file.size > MAX_SELECTABLE_SIZE_MB * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is ${MAX_SELECTABLE_SIZE_MB}MB.`);
      return;
    }

    setIsReplacing(true);
    try {
      const formData = new FormData();
      formData.append("file", await downscaleImageForUpload(file));
      formData.append("category", "recipes");

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      if (!result.success || !result.file?.url) throw new Error("Upload failed - no URL returned");

      onChange(result.file.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsReplacing(false);
    }
  };

  // Same 16:9 shape as the recipe page hero, so the preview matches what viewers see
  return (
    <div className="space-y-2">
      <ImageUpload
        category="recipes"
        value={value}
        onChange={onChange}
        onRemove={onRemove}
        disabled={disabled || isReplacing}
        placeholder="Upload a cover photo"
        className="aspect-video w-full flex items-center justify-center"
        previewClassName="aspect-video"
      />

      {value && !disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="replace-cover-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset so picking the same file again still fires a change
              e.target.value = "";
              if (file) replaceCover(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isReplacing}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {isReplacing ? "Uploading..." : "Replace"}
          </Button>
        </>
      )}
    </div>
  );
}
