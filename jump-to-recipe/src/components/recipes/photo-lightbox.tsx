"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecipePhoto } from "@/types/recipe-photos";

interface PhotoLightboxProps {
  photos: RecipePhoto[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  isOpen,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Reset state when opening/closing or changing photos
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
    }
  }, [isOpen, initialIndex]);

  // Reset zoom and position when changing photos
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
  }, [currentIndex]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      // Restore focus
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }
  }, [photos.length]);

  const goToNext = useCallback(() => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }
  }, [photos.length]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.5, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, zoomIn, zoomOut, resetZoom]);

  // Touch and mouse drag handling
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (scale <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
    event.preventDefault();
  }, [scale, position]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;

    setPosition({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
    event.preventDefault();
  }, [isDragging, scale, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance?: number } | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      // Single touch - prepare for swipe
      setTouchStart({
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      });
    } else if (event.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      });
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStart) return;

    if (event.touches.length === 2 && touchStart.distance) {
      // Pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = currentDistance / touchStart.distance;
      const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 4);
      setScale(newScale);
      
      // Update touch start for next calculation
      setTouchStart({
        ...touchStart,
        distance: currentDistance,
      });
      
      event.preventDefault();
    }
  }, [touchStart, scale]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStart || event.touches.length > 0) return;

    // Single touch swipe detection
    if (event.changedTouches.length === 1 && !touchStart.distance) {
      const touchEnd = event.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStart.x;
      const deltaY = touchEnd.clientY - touchStart.y;
      
      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    }
    
    setTouchStart(null);
  }, [touchStart, goToPrevious, goToNext]);

  // Double tap to zoom
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  }, [scale, resetZoom]);

  const handleTouchEndForDoubleTap = useCallback((event: React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      handleDoubleClick();
    }
    
    setLastTap(now);
    handleTouchEnd(event);
  }, [lastTap, handleDoubleClick, handleTouchEnd]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const photoUrl = currentPhoto.filePath.startsWith('/uploads/') || currentPhoto.filePath.startsWith('http') 
    ? currentPhoto.filePath 
    : `/uploads/${currentPhoto.filePath}`;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="text-white hover:bg-white/20 h-10 w-10"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          onClick={resetZoom}
          className="text-white hover:bg-white/20 px-3 h-10"
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          disabled={scale >= 4}
          className="text-white hover:bg-white/20 h-10 w-10"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </div>

      {/* Photo counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} of {photos.length}
        </div>
      )}

      {/* Photo container */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndForDoubleTap}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Photo */}
        <img
          ref={imageRef}
          src={photoUrl}
          alt={currentPhoto.fileName}
          className={cn(
            "max-w-full max-h-full object-contain transition-transform duration-200",
            isDragging && "transition-none"
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          draggable={false}
        />
      </div>

      {/* Photo info */}
      <div className="absolute bottom-4 right-4 z-10 text-white bg-black/50 px-3 py-2 rounded text-sm max-w-xs">
        <div className="font-medium truncate">{currentPhoto.fileName}</div>
        <div className="text-xs opacity-75">
          {(currentPhoto.fileSize / 1024 / 1024).toFixed(1)} MB
        </div>
      </div>
    </div>
  );
}