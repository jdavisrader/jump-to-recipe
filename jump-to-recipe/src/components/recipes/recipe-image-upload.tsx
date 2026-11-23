"use client";

import { ImageUpload } from "@/components/ui/image-upload";

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
  // Same 16:9 shape as the recipe page hero, so the preview matches what viewers see
  return (
    <ImageUpload
      category="recipes"
      value={value}
      onChange={onChange}
      onRemove={onRemove}
      disabled={disabled}
      placeholder="Upload a cover photo"
      className="aspect-video w-full flex items-center justify-center"
      previewClassName="aspect-video"
    />
  );
}