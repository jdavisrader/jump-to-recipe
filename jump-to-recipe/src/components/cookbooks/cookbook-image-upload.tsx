"use client";

import { ImageUpload } from "@/components/ui/image-upload";

interface CookbookImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function CookbookImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
}: CookbookImageUploadProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cookbook Cover</label>
      <ImageUpload
        category="cookbooks"
        value={value}
        onChange={onChange}
        onRemove={onRemove}
        disabled={disabled}
        placeholder="Upload a cover image"
        className="aspect-[3/4] max-w-xs"
      />
      <p className="text-xs text-gray-500">
        Choose a cover image that represents your cookbook. This will be displayed when sharing your cookbook.
      </p>
    </div>
  );
}