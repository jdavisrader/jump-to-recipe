"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Image from "next/image";
import { Trash2, GripVertical, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { RecipePhotosUpload } from "./recipe-photos-upload";
import { cn } from "@/lib/utils";
import { RecipePhoto } from "@/types/recipe-photos";

interface RecipePhotosManagerProps {
  recipeId: string;
  photos: RecipePhoto[];
  canEdit: boolean;
  onPhotosChange: (photos: RecipePhoto[]) => void;
  className?: string;
}

export function RecipePhotosManager({
  recipeId,
  photos,
  canEdit,
  onPhotosChange,
  className,
}: RecipePhotosManagerProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    photo: RecipePhoto | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    photo: null,
    isLoading: false,
  });

  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);

  // Sort photos by position
  const sortedPhotos = [...photos]
    .filter(photo => !photo.deletedAt)
    .sort((a, b) => a.position - b.position);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setDraggedPhotoId(null);

      if (!result.destination || !canEdit) {
        return;
      }

      const { source, destination } = result;

      if (source.index === destination.index) {
        return;
      }

      // Create a new array with reordered photos
      const reorderedPhotos = Array.from(sortedPhotos);
      const [removed] = reorderedPhotos.splice(source.index, 1);
      reorderedPhotos.splice(destination.index, 0, removed);

      // Update positions
      const updatedPhotos = reorderedPhotos.map((photo, index) => ({
        ...photo,
        position: index,
      }));

      // Optimistically update the UI
      const allPhotos = photos.map(photo => {
        const updatedPhoto = updatedPhotos.find(p => p.id === photo.id);
        return updatedPhoto || photo;
      });
      onPhotosChange(allPhotos);

      try {
        // Send reorder request to API
        const response = await fetch(`/api/recipes/${recipeId}/photos/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoOrders: updatedPhotos.map(photo => ({
              id: photo.id,
              position: photo.position,
            })),
          }),
        });

        if (response.status === 403) {
          throw new Error('You do not have permission to reorder photos for this recipe');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reorder photos');
        }

        const result = await response.json();
        if (result.success && result.photos) {
          // Update with server response
          onPhotosChange(result.photos);
        }
      } catch (error) {
        console.error('Error reordering photos:', error);
        // Revert optimistic update on error
        onPhotosChange(photos);
        alert(error instanceof Error ? error.message : 'Failed to reorder photos');
      }
    },
    [sortedPhotos, canEdit, photos, onPhotosChange, recipeId]
  );

  const handleDragStart = useCallback((result: any) => {
    setDraggedPhotoId(result.draggableId);
  }, []);

  const handleDeletePhoto = useCallback(
    async (photo: RecipePhoto) => {
      setDeleteModal({ isOpen: true, photo, isLoading: false });
    },
    []
  );

  const confirmDeletePhoto = useCallback(async () => {
    if (!deleteModal.photo) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/recipes/photos/${deleteModal.photo.id}`, {
        method: 'DELETE',
      });

      if (response.status === 403) {
        throw new Error('You do not have permission to delete photos from this recipe');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      const result = await response.json();
      if (result.success) {
        // Remove the photo from the list
        const updatedPhotos = photos.filter(p => p.id !== deleteModal.photo!.id);
        onPhotosChange(updatedPhotos);
      }

      setDeleteModal({ isOpen: false, photo: null, isLoading: false });
    } catch (error) {
      console.error('Error deleting photo:', error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
      alert(error instanceof Error ? error.message : 'Failed to delete photo');
    }
  }, [deleteModal.photo, photos, onPhotosChange]);

  const cancelDeletePhoto = useCallback(() => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, photo: null, isLoading: false });
    }
  }, [deleteModal.isLoading]);

  const getPhotoUrl = useCallback((photo: RecipePhoto) => {
    // If filePath already starts with /uploads/ or is a full URL, use it as-is
    // Otherwise, prepend /uploads/
    if (photo.filePath.startsWith('/uploads/') || photo.filePath.startsWith('http')) {
      return photo.filePath;
    }
    return `/uploads/${photo.filePath}`;
  }, []);

  if (!canEdit && sortedPhotos.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-muted-foreground">
          No photos have been added to this recipe yet.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Section - Only show if user can edit */}
      {canEdit && (
        <RecipePhotosUpload
          recipeId={recipeId}
          existingPhotos={sortedPhotos.map(photo => ({
            id: photo.id,
            filePath: photo.filePath,
            fileName: photo.fileName,
          }))}
          onPhotosChange={(newPhotos) => {
            // Check if newPhotos contains full RecipePhoto objects or just basic info
            const existingPhotoIds = new Set(photos.map(p => p.id));
            const addedPhotos = newPhotos.filter(p => !existingPhotoIds.has(p.id));
            
            if (addedPhotos.length > 0) {
              // If the photos already have all RecipePhoto properties, use them directly
              // Otherwise, convert to RecipePhoto format
              const convertedPhotos: RecipePhoto[] = addedPhotos.map((photo, index) => {
                // Check if this is already a full RecipePhoto object
                if ('createdAt' in photo && 'updatedAt' in photo) {
                  return photo as RecipePhoto;
                }
                
                // Convert basic photo info to RecipePhoto format
                return {
                  id: photo.id,
                  recipeId,
                  filePath: photo.filePath,
                  fileName: photo.fileName,
                  fileSize: 0, // Will be set by server
                  mimeType: '', // Will be set by server
                  position: photos.length + index,
                  deletedAt: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
              });
              
              onPhotosChange([...photos, ...convertedPhotos]);
            }
          }}
        />
      )}

      {/* Photo Grid */}
      {sortedPhotos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Recipe Photos</h3>
          
          {canEdit ? (
            <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
              <Droppable droppableId="photos" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2",
                      snapshot.isDraggingOver && "bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                    )}
                  >
                    {sortedPhotos.map((photo, index) => (
                      <Draggable key={photo.id} draggableId={photo.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700",
                              snapshot.isDragging && "shadow-2xl border-blue-300 dark:border-blue-600 rotate-1 scale-105",
                              !snapshot.isDragging && "hover:border-gray-300 dark:hover:border-gray-600 transition-colors",
                              draggedPhotoId === photo.id && !snapshot.isDragging && "opacity-50"
                            )}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.05)`
                                : provided.draggableProps.style?.transform,
                            }}
                          >
                            {/* Photo Image */}
                            <Image
                              src={getPhotoUrl(photo)}
                              alt={photo.fileName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />

                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <GripVertical className="h-4 w-4 text-white" />
                            </div>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              onClick={() => handleDeletePhoto(photo)}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              aria-label={`Delete photo ${photo.fileName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Position Indicator */}
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                              {index + 1}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            // Read-only grid for non-editors
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <Image
                    src={getPhotoUrl(photo)}
                    alt={photo.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  
                  {/* Position Indicator */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {sortedPhotos.length === 0 && canEdit && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500 dark:text-gray-400 text-center">
            <div className="text-lg font-medium mb-2">No photos yet</div>
            <div className="text-sm">
              Upload photos to showcase your recipe visually
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDeletePhoto}
        onConfirm={confirmDeletePhoto}
        title="Delete Photo"
        description={`Are you sure you want to delete "${deleteModal.photo?.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}