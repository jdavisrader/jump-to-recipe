'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableTitle } from './editable-title';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  name: string;
  order: number;
}

interface SectionHeaderProps {
  section: Section;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  canDelete?: boolean;
  className?: string;
  isDragging?: boolean;
  isDeleting?: boolean;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ isOpen, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center section-modal-backdrop">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 section-modal-content">
        <h3 className="text-lg font-semibold mb-4">Delete Section</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Delete this section and all its contents? This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="section-button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="section-button"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  section,
  onRename,
  onDelete,
  canDelete = true,
  className,
  isDragging = false,
  isDeleting = false
}: SectionHeaderProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleRename = (newName: string) => {
    onRename(section.id, newName);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(section.id);
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600',
          isDragging && 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
          isDeleting && 'animate-pulse opacity-50',
          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200',
          className
        )}
      >
        {/* Drag Handle */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "cursor-grab active:cursor-grabbing",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-gray-600",
            "transition-all duration-200",
            isDragging && "text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-800"
          )}
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Editable Title */}
        <div className="flex-1">
          <EditableTitle
            value={section.name}
            onChange={handleRename}
            className="text-lg font-medium"
            disabled={isDeleting}
          />
        </div>

        {/* Delete Button */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={cn(
              "text-gray-400 hover:text-red-600 dark:hover:text-red-400 section-button",
              isDeleting && "animate-spin"
            )}
            title="Delete section"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 section-spinner" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}