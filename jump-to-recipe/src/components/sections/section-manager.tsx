'use client';

import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './section-header';
import { cn } from '@/lib/utils';
import './section-animations.css';

/**
 * Section data structure for organizing recipe ingredients or instructions.
 * 
 * @template T - The type of items contained in the section (e.g., Ingredient or Instruction)
 */
export interface Section<T = any> {
  /** Unique identifier for the section */
  id: string;
  /** Display name of the section */
  name: string;
  /** Order index of the section (reflects creation order) */
  order: number;
  /** Array of items contained in this section */
  items: T[];
}

/**
 * Props for the SectionManager component.
 * 
 * @template T - The type of items contained in sections (must have an 'id' property)
 */
interface SectionManagerProps<T> {
  /** Array of sections to display */
  sections: Section<T>[];
  /** Callback when sections are modified (add, rename, delete) */
  onSectionsChange: (sections: Section<T>[]) => void;
  /** Callback when adding a new item to a section */
  onAddItem: (sectionId: string) => void;
  /** Callback when removing an item from a section */
  onRemoveItem: (sectionId: string, itemId: string) => void;
  /** Render function for individual items within sections */
  renderItem: (item: T, index: number, sectionId: string) => React.ReactNode;
  /** Type of items being managed ('ingredient' or 'instruction') */
  itemType: 'ingredient' | 'instruction';
  /** Additional CSS classes for the container */
  className?: string;
  /** Custom label for the "Add Section" button */
  addSectionLabel?: string;
  /** Custom label for the "Add Item" buttons */
  addItemLabel?: string;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Whether a section is currently being added */
  isAddingSection?: boolean;
  /** Map of section IDs to their loading states when adding items */
  isAddingItem?: Record<string, boolean>;
}

/**
 * SectionManager - Manages a list of sections for organizing recipe ingredients or instructions.
 * 
 * This component provides a simplified interface for managing sections with the following behaviors:
 * - **Append-Only Ordering**: New sections are always added to the bottom of the list
 * - **Order Stability**: Section order remains stable during rename and delete operations
 * - **No Reordering**: Sections cannot be reordered after creation (no drag-and-drop)
 * 
 * @template T - The type of items contained in sections (must have an 'id' property)
 * 
 * @example
 * ```tsx
 * <SectionManager
 *   sections={ingredientSections}
 *   onSectionsChange={setIngredientSections}
 *   onAddItem={handleAddIngredient}
 *   onRemoveItem={handleRemoveIngredient}
 *   renderItem={(item, index, sectionId) => <IngredientItem {...item} />}
 *   itemType="ingredient"
 * />
 * ```
 */
export function SectionManager<T extends { id: string }>({
  sections,
  onSectionsChange,
  onAddItem,
  onRemoveItem,
  renderItem,
  itemType,
  className,
  addSectionLabel,
  addItemLabel,
  isLoading = false,
  isAddingSection = false,
  isAddingItem = {}
}: SectionManagerProps<T>) {
  const defaultAddSectionLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Instruction'} Section`;
  const defaultAddItemLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Step'}`;

  /**
   * Adds a new section to the bottom of the list.
   * The new section is assigned an order value equal to the current section count,
   * ensuring it appears at the end.
   */
  const handleAddSection = () => {
    const newSection: Section<T> = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: 'Untitled Section',
      order: sections.length,
      items: []
    };

    onSectionsChange([...sections, newSection]);
  };

  /**
   * Renames a section without changing its position in the list.
   * Order stability is maintained - only the name is updated.
   * 
   * @param sectionId - The ID of the section to rename
   * @param newName - The new name for the section
   */
  const handleSectionRename = (sectionId: string, newName: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, name: newName }
        : section
    );
    onSectionsChange(updatedSections);
  };

  /**
   * Deletes a section and reindexes the remaining sections.
   * The relative order of remaining sections is preserved, but their
   * order values are updated to maintain sequential numbering.
   * 
   * @param sectionId - The ID of the section to delete
   */
  const handleSectionDelete = (sectionId: string) => {
    const updatedSections = sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    onSectionsChange(updatedSections);
  };

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="section-skeleton h-12 w-full rounded-lg" />
            <div className="ml-6 space-y-2">
              <div className="section-skeleton h-8 w-3/4 rounded" />
              <div className="section-skeleton h-8 w-1/2 rounded" />
            </div>
          </div>
        ))}
        <div className="section-skeleton h-10 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-6">
        {sortedSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <div className="text-lg font-medium mb-2">No sections yet</div>
              <div className="text-sm">
                Create your first {itemType} section to organize your recipe
              </div>
            </div>
          </div>
        ) : (
          sortedSections.map((section) => (
            <div
              key={section.id}
              className={cn(
                // Base section container styling
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm',
                // Smooth transitions for hover effects
                'transition-[box-shadow,border-color,background-color] duration-200 ease-in-out',
                // Spacing and layout
                'p-4 space-y-3',
                // Hover state
                'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {/* Section Header */}
              <SectionHeader
                section={section}
                onRename={handleSectionRename}
                onDelete={handleSectionDelete}
                canDelete={sections.length > 1}
              />

              {/* Section Items */}
              <div className="space-y-3 mt-4">
                {section.items.length === 0 && (
                  <div className="flex items-center gap-2 p-3 border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm section-empty-indicator">
                    <div className="flex-shrink-0 w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full section-empty-dot"></div>
                    <span>This section is empty. Add {itemType === 'ingredient' ? 'ingredients' : 'steps'} below.</span>
                  </div>
                )}

                {section.items.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="section-item-enter"
                  >
                    {renderItem(item, itemIndex, section.id)}
                  </div>
                ))}

                {/* Add Item Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddItem(section.id)}
                  disabled={isAddingItem[section.id]}
                  className={cn(
                    "text-sm section-button",
                    isAddingItem[section.id] && "animate-pulse"
                  )}
                >
                  {isAddingItem[section.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 section-spinner" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {addItemLabel || defaultAddItemLabel}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Section Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddSection}
        disabled={isAddingSection}
        className={cn(
          "w-full section-button",
          isAddingSection && "animate-pulse"
        )}
      >
        {isAddingSection ? (
          <Loader2 className="h-4 w-4 mr-2 section-spinner" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {addSectionLabel || defaultAddSectionLabel}
      </Button>
    </div>
  );
}