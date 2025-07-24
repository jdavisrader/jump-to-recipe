'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidImageUrl } from '@/lib/image-validation';

interface CookbookImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export function CookbookImage({ 
  src, 
  alt, 
  className,
  fill = false,
  width,
  height,
  priority = false,
  sizes
}: CookbookImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the URL is valid before attempting to load
  const isUrlValid = src && src.trim() !== '' ? isValidImageUrl(src) : false;

  // If no src provided, invalid URL, or error occurred, show placeholder
  if (!src || !isUrlValid || hasError) {
    // Log a warning for invalid URLs (but not for empty/null URLs)
    if (src && src.trim() !== '' && !isUrlValid) {
      console.warn(`Invalid or unsupported image URL: ${src}`);
    }
    
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        fill ? "absolute inset-0" : "",
        className
      )}>
        <Book className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  const handleError = () => {
    console.warn(`Failed to load cookbook image: ${src}`);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const imageProps = {
    src,
    alt,
    onError: handleError,
    onLoad: handleLoad,
    className: cn(
      "object-cover transition-opacity duration-300",
      isLoading ? "opacity-0" : "opacity-100",
      className
    ),
    priority,
    sizes,
    ...(fill ? { fill: true } : { width, height })
  };

  return (
    <>
      {isLoading && (
        <div className={cn(
          "flex items-center justify-center bg-muted animate-pulse",
          fill ? "absolute inset-0" : "",
          className
        )}>
          <Book className="h-16 w-16 text-muted-foreground/50" />
        </div>
      )}
      <Image {...imageProps} />
    </>
  );
}