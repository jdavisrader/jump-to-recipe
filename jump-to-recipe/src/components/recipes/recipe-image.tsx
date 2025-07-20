"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface RecipeImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function RecipeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = "", 
  priority = false 
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src provided or error occurred, show placeholder
  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs text-center px-2">No image available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground animate-pulse ${className}`}
        >
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}