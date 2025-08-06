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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Recipe Image</label>
      <ImageUpload
        category="recipes"
        value={value}
        onChange={onChange}
        onRemove={onRemove}
        disabled={disabled}
        placeholder="Upload a recipe image"
        className="aspect-video max-w-md"
      />
      <p className="text-xs text-gray-500">
        Upload an appetizing photo of your recipe. This will be displayed on recipe cards and in your cookbook.
      </p>
    </div>
  );
}