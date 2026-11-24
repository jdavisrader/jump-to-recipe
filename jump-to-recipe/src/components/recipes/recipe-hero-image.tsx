"use client";

import { ImagePlus } from "lucide-react";

import { RecipeImage } from "./recipe-image";

interface RecipeHeroImageProps {
  imageUrl?: string | null;
  title: string;
  canEdit: boolean;
  onEdit?: () => void;
}

const frameClasses = "aspect-[4/3] w-full overflow-hidden rounded-2xl";

export function RecipeHeroImage({ imageUrl, title, canEdit, onEdit }: RecipeHeroImageProps) {
  if (imageUrl) {
    return (
      <div className={`${frameClasses} border print:max-h-64`}>
        <RecipeImage
          src={imageUrl}
          alt={title}
          width={800}
          height={600}
          className="h-full w-full object-cover"
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
      className={`${frameClasses} flex flex-col items-center justify-center gap-2 border border-dashed bg-muted/40 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden`}
    >
      <ImagePlus className="h-8 w-8" aria-hidden="true" />
      Add a photo
    </button>
  );
}
