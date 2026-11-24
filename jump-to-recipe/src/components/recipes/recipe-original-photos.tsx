"use client";

import { useEffect, useState } from "react";

import { RecipePhotosViewer } from "./recipe-photos-viewer";
import type { RecipePhoto } from "@/types/recipe-photos";

interface RecipeOriginalPhotosProps {
  recipeId: string;
}

/**
 * Photos or scans of the original recipe. Renders nothing until photos have
 * loaded, so recipes without any don't flash an empty placeholder.
 */
export function RecipeOriginalPhotos({ recipeId }: RecipeOriginalPhotosProps) {
  const [photos, setPhotos] = useState<RecipePhoto[]>([]);

  useEffect(() => {
    let isCurrent = true;

    const fetchPhotos = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}/photos`);
        if (!response.ok) {
          console.error("Failed to fetch photos:", response.statusText);
          return;
        }
        const data = await response.json();
        if (isCurrent) setPhotos(data.photos || []);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };

    setPhotos([]);
    fetchPhotos();
    return () => {
      isCurrent = false;
    };
  }, [recipeId]);

  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="original-recipe-heading" className="border-t pt-8 print:hidden">
      <h2 id="original-recipe-heading" className="text-2xl font-bold tracking-tight">
        Original recipe
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Photos or scans of the handwritten or printed recipe.
      </p>
      <div className="mt-5">
        <RecipePhotosViewer photos={photos} />
      </div>
    </section>
  );
}
