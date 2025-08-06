"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface RecipeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function RecipeImage({ 
  src, 
  alt, 
  className,
  fallback
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 text-gray-400",
        className
      )}>
        {fallback || <ImageIcon className="h-8 w-8" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}