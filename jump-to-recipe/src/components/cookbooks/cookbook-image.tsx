"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface CookbookImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}

export function CookbookImage({ 
  src, 
  alt, 
  className,
  fallback
}: CookbookImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-gray-500",
        className
      )}>
        {fallback || <BookOpen className="h-8 w-8" />}
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