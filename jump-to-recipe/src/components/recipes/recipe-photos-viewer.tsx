"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoLightbox } from "./photo-lightbox";
import { RecipePhoto } from "@/types/recipe-photos";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface RecipePhotosViewerProps {
  photos: RecipePhoto[];
  className?: string;
}

export function RecipePhotosViewer({ photos, className }: RecipePhotosViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Filter out deleted photos and sort by position
  const visiblePhotos = photos
    .filter(photo => !photo.deletedAt)
    .sort((a, b) => a.position - b.position);

  if (visiblePhotos.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p>Add original photos</p>
      </div>
    );
  }

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleImageError = (photoId: string) => {
    setImageErrors(prev => new Set(prev).add(photoId));
  };

  return (
    <>
      <div className={cn("grid gap-4", className)}>
        {/* Grid layout - responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visiblePhotos.map((photo, index) => {
            const hasError = imageErrors.has(photo.id);
            return (
              <div
                key={photo.id}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-muted"
                onClick={() => !hasError && handlePhotoClick(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!hasError && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handlePhotoClick(index);
                  }
                }}
                aria-label={`View photo: ${photo.fileName}`}
              >
                {hasError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageOff className="h-8 w-8 mb-2" />
                    <span className="text-xs">Failed to load</span>
                  </div>
                ) : (
                  <>
                    <Image
                      src={photo.filePath.startsWith('/uploads/') || photo.filePath.startsWith('http') ? photo.filePath : `/uploads/${photo.filePath}`}
                      alt={photo.fileName}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      onError={() => handleImageError(photo.id)}
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-sm font-medium">
                        View Photo
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Photo count */}
        <p className="text-sm text-muted-foreground text-center">
          {visiblePhotos.length} photo{visiblePhotos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        photos={visiblePhotos}
        initialIndex={selectedPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}