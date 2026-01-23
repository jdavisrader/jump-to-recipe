'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
  
  /** 
   * Callback when the section is renamed.
   * Called when the user finishes editing the section name.
   * 
   * @param id - The ID of the section being renamed
   * @param name - The new name for the section
   */
  onRename: (id: string, name: string) => void;
  
  /** 
   * Callback when the section is deleted.
   * Called after the user confirms deletion (for sections with items)
   * or immediately (for empty sections).
   * 
   * @param id - The ID of the section to delete
   */
  onDelete: (id: string) => void;
  
  /** 
   * Whether the delete button should be enabled.
   * Typically set to false when this is the only section.
   */
  canDelete?: boolean;
  
  /** Additional CSS classes for the container */
  className?: string;
  
  /** 
   * Whether the section is currently being deleted.
   * When true, shows a loading spinner and disables interactions.
   */
  isDeleting?: boolean;
  
  /** 
   * Whether the section has a validation error.
   * When true, applies error styling (red border and background).
   * This is typically used for section name validation errors.
   */
  hasError?: boolean;
  
  /** 
   * Validation error message to display.
   * When provided, displays below the section name with error styling.
   * The message should be clear and actionable (e.g., "Section name is required").
   */
  errorMessage?: string;
  
  /** 
   * ID for the title element (for aria-labelledby).
   * Used to associate the section header with its content for accessibility.
   */
  titleId?: string;
  
  /** 
   * Whether the section has items.
   * Used to determine deletion behavior:
   * - Sections with items require confirmation
   * - Empty sections can be deleted immediately
   */
  hasItems?: boolean;
  
  /** 
   * Whether this is the last remaining section.
   * When true, the deletion confirmation modal explains that
   * deleting this section will convert the recipe to unsectioned mode.
   */
  isLastSection?: boolean;
}

/**
 * SectionHeader - Header component for a recipe section with rename and delete controls.
 * 
 * This component provides a simplified header interface for recipe sections with comprehensive
 * validation support and smart deletion behavior.
 * 
 * ## Core Features
 * 
 * - **Inline Editing**: Click the title to rename the section
 * - **Delete Control**: Button to delete the section with smart confirmation
 * - **Validation Support**: Display validation errors for section names
 * - **No Reordering**: No drag handle or reordering controls (sections maintain creation order)
 * 
 * ## Validation Features
 * 
 * The component integrates with the validation system to provide clear feedback:
 * 
 * - **Error Styling**: When `hasError` is true, displays red border and background
 * - **Error Messages**: When `errorMessage` is provided, displays below the section name
 * - **ARIA Support**: Proper aria-invalid and aria-describedby attributes
 * - **Dark Mode**: Error styling works in both light and dark modes
 * - **Live Regions**: Error messages are announced to screen readers
 * 
 * ### Validation Error Display
 * 
 * ```tsx
 * // Section with validation error
 * <SectionHeader
 *   section={section}
 *   hasError={true}
 *   errorMessage="Section name is required"
 *   // ... other props
 * />
 * ```
 * 
 * ## Deletion Behavior
 * 
 * The component implements smart deletion logic based on section state:
 * 
 * ### Empty Sections
 * - **No Confirmation**: Deleted immediately without modal
 * - **Rationale**: Empty sections have no content to lose
 * - **UX**: Quick and frictionless deletion
 * 
 * ### Sections with Items
 * - **Confirmation Required**: Shows modal before deletion
 * - **Clear Message**: "Delete this section and all its contents?"
 * - **Destructive Action**: Clearly marked as irreversible
 * 
 * ### Last Section
 * - **Special Handling**: Different confirmation message
 * - **Explanation**: Warns that recipe will convert to unsectioned mode
 * - **Message**: "Delete this section and all its contents? This will convert your recipe to unsectioned mode."
 * 
 * ## Accessibility
 * 
 * The component follows WCAG 2.1 AA guidelines:
 * 
 * - **Keyboard Navigation**: Full keyboard support for all interactions
 * - **Screen Readers**: Proper ARIA labels and descriptions
 * - **Focus Management**: Clear focus indicators
 * - **Error Announcements**: Validation errors announced via role="alert"
 * - **Button Labels**: Descriptive aria-label for delete button
 * 
 * ## Usage Examples
 * 
 * ### Basic Usage
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
 * 
 * ### With Validation
 * 
 * @example
 * ```tsx
 * <SectionHeader
 *   section={section}
 *   onRename={handleRename}
 *   onDelete={handleDelete}
 *   canDelete={sections.length > 1}
 *   hasError={!!validationError}
 *   errorMessage={validationError}
 *   hasItems={section.items.length > 0}
 *   isLastSection={sections.length === 1}
 * />
 * ```
 * 
 * ### With Loading State
 * 
 * @example
 * ```tsx
 * <SectionHeader
 *   section={section}
 *   onRename={handleRename}
 *   onDelete={handleDelete}
 *   isDeleting={deletingId === section.id}
 * />
 * ```
 * 
 * ## Styling
 * 
 * The component uses Tailwind CSS with the following states:
 * 
 * - **Default**: Gray background with subtle border
 * - **Hover**: Slightly darker background
 * - **Error**: Red border and background (light red in light mode, dark red in dark mode)
 * - **Deleting**: Pulsing animation with reduced opacity
 * 
 * ## Related Components
 * 
 * @see {@link EditableTitle} for the inline editing functionality
 * @see {@link ConfirmationModal} for the deletion confirmation
 * @see {@link SectionManager} for the parent component that uses this header
 */
export function SectionHeader({
  section,
  onRename,
  onDelete,
  canDelete = true,
  className,
  isDeleting = false,
  hasError = false,
  errorMessage,
  titleId,
  hasItems = false,
  isLastSection = false
}: SectionHeaderProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleRename = (newName: string) => {
    onRename(section.id, newName);
  };

  const handleDeleteClick = () => {
    // If section is empty, delete immediately without confirmation
    if (!hasItems) {
      onDelete(section.id);
      return;
    }
    
    // If section has items, show confirmation modal
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(section.id);
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Determine modal message based on whether this is the last section
  const modalTitle = isLastSection 
    ? "Delete Last Section" 
    : "Delete Section";
  
  const modalDescription = isLastSection
    ? "Delete this section and all its contents? This will convert your recipe to unsectioned mode. This action cannot be undone."
    : "Delete this section and all its contents? This action cannot be undone.";

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600',
          isDeleting && 'animate-pulse opacity-50',
          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200',
          hasError && 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950/20',
          className
        )}
      >
        {/* Editable Title */}
        <div className="flex-1">
          <EditableTitle
            value={section.name}
            onChange={handleRename}
            className={cn(
              "text-lg font-medium",
              hasError && "text-red-700 dark:text-red-300"
            )}
            disabled={isDeleting}
            id={titleId}
            aria-invalid={hasError}
            aria-describedby={errorMessage ? `${titleId}-error` : undefined}
          />
          {errorMessage && (
            <div 
              id={`${titleId}-error`}
              className="text-red-600 dark:text-red-400 text-sm mt-1"
              role="alert"
            >
              {errorMessage}
            </div>
          )}
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
            aria-label={`Delete ${section.name} section`}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 section-spinner" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title={modalTitle}
        description={modalDescription}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}