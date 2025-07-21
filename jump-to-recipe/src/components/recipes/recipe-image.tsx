"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface RecipeImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

// Helper function to validate image URL
function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url === 'undefined' || url.trim() === '') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function RecipeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = "", 
  priority = false,
  unoptimized = true // Default to unoptimized to avoid domain issues
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Validate the image URL
  const isValidUrl = isValidImageUrl(src);

  // If no valid src provided or error occurred, show placeholder
  if (!isValidUrl || hasError) {
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
        src={src!} // We know it's valid at this point
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}