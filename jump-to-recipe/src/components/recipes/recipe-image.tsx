"use client";

import { useState } from "react";
import Image from "next/image";
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
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={cn("object-cover", className)}
      onError={() => setHasError(true)}
    />
  );
}