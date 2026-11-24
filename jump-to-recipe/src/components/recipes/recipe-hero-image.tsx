"use client";

import { ImagePlus } from "lucide-react";

import { RecipeImage } from "./recipe-image";

interface RecipeHeroImageProps {
  imageUrl?: string | null;
  title: string;
  canEdit: boolean;
  onEdit?: () => void;
}

// Wide banner on larger screens, closer to square on phones
const frameClasses = "aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-[16/7]";

export function RecipeHeroImage({ imageUrl, title, canEdit, onEdit }: RecipeHeroImageProps) {
  if (imageUrl) {
    return (
      <div className={`${frameClasses} border`}>
        <RecipeImage
          src={imageUrl}
          alt={title}
          width={1200}
          height={525}
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
