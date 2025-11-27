'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableTitle } from './editable-title';
import { cn } from '@/lib/utils';

/**
 * Section data structure (minimal interface for header display).
 */
interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Display name of the section */
  name: string;
  /** Order index of the section (for reference only, not used for reordering) */
  order: number;
}

/**
 * Props for the SectionHeader component.
 */
interface SectionHeaderProps {
  /** The section to display */
  section: Section;
  /** Callback when the section is renamed */
  onRename: (id: string, name: string) => void;
  /** Callback when the section is deleted */
  onDelete: (id: string) => void;
  /** Whether the delete button should be enabled */
  canDelete?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether the section is currently being deleted */
  isDeleting?: boolean;
}

/**
 * Props for the delete confirmation modal.
 */
interface DeleteConfirmationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Callback when deletion is cancelled */
  onCancel: () => void;
}

/**
 * DeleteConfirmationModal - Modal dialog for confirming section deletion.
 * 
 * Displays a confirmation dialog to prevent accidental deletion of sections
 * and their contents.
 */
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

/**
 * SectionHeader - Header component for a recipe section with rename and delete controls.
 * 
 * This component provides a simplified header interface with:
 * - **Inline Editing**: Click the title to rename the section
 * - **Delete Control**: Button to delete the section with confirmation
 * - **No Reordering**: No drag handle or reordering controls
 * 
 * The section's position in the list cannot be changed through this component.
 * Sections maintain their creation order and can only be renamed or deleted.
 * 
 * @example
 * ```tsx
 * <SectionHeader
 *   section={section}
 *   onRename={handleRename}
 *   onDelete={handleDelete}
 *   canDelete={sections.length > 1}
 * />
 * ```
 */
export function SectionHeader({
  section,
  onRename,
  onDelete,
  canDelete = true,
  className,
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
          isDeleting && 'animate-pulse opacity-50',
          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200',
          className
        )}
      >
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