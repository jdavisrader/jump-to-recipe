"use client";

import { ImagePlus } from "lucide-react";

import { RecipeImage } from "./recipe-image";

interface RecipeHeroImageProps {
  imageUrl?: string | null;
  title: string;
  canEdit: boolean;
  onEdit?: () => void;
}

export function RecipeHeroImage({ imageUrl, title, canEdit, onEdit }: RecipeHeroImageProps) {
  if (imageUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <RecipeImage
          src={imageUrl}
          alt={title}
          width={800}
          height={450}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    );
  }

  // Only owners get a prompt; everyone else sees the title at the top
  if (!canEdit) return null;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-dashed py-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ImagePlus className="h-4 w-4" aria-hidden="true" />
      Add a photo
    </button>
  );
}
