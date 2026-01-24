"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  fallback,
  width = 400,
  height = 300,
  priority = false
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);

  // Use placeholder image if no src or error
  const imageSrc = (!src || hasError) ? '/recipe-placeholder.jpg' : src;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setHasError(true)}
    />
  );
}