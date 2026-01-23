'use client';

import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './section-header';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
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
  
  /** 
   * Callback when sections are modified (add, rename, delete).
   * This is called whenever the section list changes, allowing the parent
   * component to update its state.
   */
  onSectionsChange: (sections: Section<T>[]) => void;
  
  /** 
   * Callback when adding a new item to a section.
   * The parent component should handle creating the item and updating the section.
   * 
   * @param sectionId - The ID of the section to add an item to
   */
  onAddItem: (sectionId: string) => void;
  
  /** 
   * Callback when removing an item from a section.
   * The parent component should handle removing the item from the section.
   * 
   * @param sectionId - The ID of the section containing the item
   * @param itemId - The ID of the item to remove
   */
  onRemoveItem: (sectionId: string, itemId: string) => void;
  
  /** 
   * Render function for individual items within sections.
   * This allows the parent to control how items are displayed.
   * 
   * @param item - The item to render
   * @param index - The index of the item within its section
   * @param sectionId - The ID of the section containing the item
   * @returns React node to render for this item
   */
  renderItem: (item: T, index: number, sectionId: string) => React.ReactNode;
  
  /** 
   * Type of items being managed ('ingredient' or 'instruction').
   * This affects labels and validation error messages.
   */
  itemType: 'ingredient' | 'instruction';
  
  /** Additional CSS classes for the container */
  className?: string;
  
  /** Custom label for the "Add Section" button (defaults to "Add [Type] Section") */
  addSectionLabel?: string;
  
  /** Custom label for the "Add Item" buttons (defaults to "Add [Type]") */
  addItemLabel?: string;
  
  /** Whether the component is in a loading state (shows skeleton UI) */
  isLoading?: boolean;
  
  /** Whether a section is currently being added (shows loading state on add button) */
  isAddingSection?: boolean;
  
  /** 
   * Map of section IDs to their loading states when adding items.
   * Used to show loading indicators on specific "Add Item" buttons.
   */
  isAddingItem?: Record<string, boolean>;
  
  /** 
   * Map of field paths to validation error messages.
   * Field paths follow the format: `${itemType}Sections.${index}.${field}`
   * 
   * Examples:
   * - `ingredientSections.0.name` - Section name error
   * - `ingredientSections.0.items` - Empty section error
   * - `ingredientSections.0.items.0.text` - Item text error
   * 
   * This prop enables inline validation error display throughout the component.
   */
  validationErrors?: Map<string, string>;
  
  /** 
   * Callback triggered when validation should be performed.
   * Called after section operations (add, rename, delete) to update validation state.
   * The parent component should re-run validation and update the validationErrors map.
   */
  onValidate?: () => void;
}

/**
 * SectionManager - Manages a list of sections for organizing recipe ingredients or instructions.
 * 
 * This component provides a comprehensive interface for managing recipe sections with the following features:
 * 
 * ## Core Behaviors
 * 
 * - **Append-Only Ordering**: New sections are always added to the bottom of the list
 * - **Order Stability**: Section order remains stable during rename and delete operations
 * - **No Reordering**: Sections cannot be reordered after creation (no drag-and-drop)
 * - **Automatic Reindexing**: When sections are deleted, remaining sections are reindexed sequentially
 * 
 * ## Validation Support
 * 
 * The component integrates with the validation system to provide real-time feedback:
 * 
 * - **Section Name Validation**: Displays errors for empty or invalid section names
 * - **Empty Section Validation**: Shows warnings when sections have no items
 * - **Visual Feedback**: Invalid sections are highlighted with red borders and backgrounds
 * - **Inline Errors**: Validation messages appear directly below the invalid field
 * - **Accessibility**: Full ARIA support with live regions and field associations
 * 
 * ## Deletion Behavior
 * 
 * - **Confirmation Required**: Sections with items require user confirmation before deletion
 * - **Immediate Deletion**: Empty sections can be deleted without confirmation
 * - **Last Section Handling**: Deleting the last section converts the recipe to unsectioned mode
 * - **Clear Messaging**: Confirmation modal explains the consequences of deletion
 * 
 * ## Error Handling
 * 
 * The component displays validation errors at multiple levels:
 * 
 * 1. **Section-Level Errors**: Displayed in the section header (e.g., empty name)
 * 2. **Content-Level Errors**: Displayed inside the section (e.g., no items)
 * 3. **Item-Level Errors**: Passed through to the renderItem function
 * 
 * Error messages are:
 * - Clear and actionable
 * - Announced to screen readers
 * - Styled for visibility in light and dark modes
 * - Automatically cleared when the issue is resolved
 * 
 * ## Usage with Validation
 * 
 * @example
 * ```tsx
 * function RecipeForm() {
 *   const { validate, getFieldError, isValid } = useRecipeValidation();
 *   const [validationErrors, setValidationErrors] = useState(new Map());
 *   
 *   const handleValidation = () => {
 *     const formData = form.getValues();
 *     const isFormValid = validate(formData);
 *     
 *     // Update validation errors map
 *     const errorsMap = new Map();
 *     errors.forEach(error => {
 *       const key = error.path.join('.');
 *       errorsMap.set(key, error.message);
 *     });
 *     setValidationErrors(errorsMap);
 *     
 *     return isFormValid;
 *   };
 *   
 *   return (
 *     <SectionManager
 *       sections={ingredientSections}
 *       onSectionsChange={setIngredientSections}
 *       onAddItem={handleAddIngredient}
 *       onRemoveItem={handleRemoveIngredient}
 *       renderItem={(item, index, sectionId) => (
 *         <IngredientItem 
 *           {...item} 
 *           error={validationErrors.get(`ingredientSections.${index}.items.${item.id}.text`)}
 *         />
 *       )}
 *       itemType="ingredient"
 *       validationErrors={validationErrors}
 *       onValidate={handleValidation}
 *     />
 *   );
 * }
 * ```
 * 
 * ## Basic Usage
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
 * 
 * @template T - The type of items contained in sections (must have an 'id' property)
 * 
 * @see {@link Section} for the section data structure
 * @see {@link SectionHeader} for the section header component
 * @see {@link useRecipeValidation} for the validation hook
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
  isAddingItem = {},
  validationErrors,
  onValidate
}: SectionManagerProps<T>) {
  const defaultAddSectionLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Instruction'} Section`;
  const defaultAddItemLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Step'}`;

  /**
   * Adds a new section to the bottom of the list.
   * The new section is assigned an order value equal to the current section count,
   * ensuring it appears at the end.
   * Uses UUID v4 for unique, collision-resistant section IDs.
   */
  const handleAddSection = () => {
    const newSection: Section<T> = {
      id: uuidv4(),
      name: 'Untitled Section',
      order: sections.length,
      items: []
    };

    onSectionsChange([...sections, newSection]);
    
    // Trigger validation after adding section
    if (onValidate) {
      onValidate();
    }
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
    
    // Trigger validation after renaming section
    if (onValidate) {
      onValidate();
    }
  };

  /**
   * Deletes a section and reindexes the remaining sections.
   * The relative order of remaining sections is preserved, but their
   * order values are updated to maintain sequential numbering.
   * 
   * When the last section is deleted, the recipe falls back to unsectioned mode.
   * 
   * @param sectionId - The ID of the section to delete
   */
  const handleSectionDelete = (sectionId: string) => {
    const updatedSections = sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    onSectionsChange(updatedSections);
    
    // Trigger validation after deleting section
    if (onValidate) {
      onValidate();
    }
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
          sortedSections.map((section, sectionIndex) => {
            // Get validation errors for this section
            const sectionNameError = validationErrors?.get(`${itemType}Sections.${sectionIndex}.name`);
            const sectionItemsError = validationErrors?.get(`${itemType}Sections.${sectionIndex}.items`);
            const hasValidationError = !!(sectionNameError || sectionItemsError);
            
            return (
              <div
                key={section.id}
                className={cn(
                  // Base section container styling
                  'bg-white dark:bg-gray-800 border rounded-xl shadow-sm',
                  // Smooth transitions for hover effects
                  'transition-[box-shadow,border-color,background-color] duration-200 ease-in-out',
                  // Spacing and layout
                  'p-4 space-y-3',
                  // Hover state
                  'hover:shadow-md',
                  // Validation error styling
                  hasValidationError
                    ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                role="group"
                aria-labelledby={`section-${section.id}-title`}
                aria-describedby={hasValidationError ? `section-${section.id}-error` : undefined}
                aria-invalid={hasValidationError}
              >
                {/* Section Header */}
                <SectionHeader
                  section={section}
                  onRename={handleSectionRename}
                  onDelete={handleSectionDelete}
                  canDelete={sections.length > 1}
                  hasError={!!sectionNameError}
                  errorMessage={sectionNameError}
                  titleId={`section-${section.id}-title`}
                  hasItems={section.items.length > 0}
                  isLastSection={sections.length === 1}
                />
                
                {/* Section Name Validation Error */}
                {sectionNameError && (
                  <div 
                    className="validation-error-container px-3 pt-2"
                    id={`section-${section.id}-name-error`}
                    role="alert"
                  >
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {sectionNameError}
                    </p>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-3 mt-4">
                  {section.items.length === 0 && (
                    <div 
                      className="flex items-center gap-2 p-3 border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm section-empty-indicator"
                      role="status"
                      aria-label={`This ${itemType} section is empty`}
                    >
                      <div className="flex-shrink-0 w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full section-empty-dot" aria-hidden="true"></div>
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

                  {/* Validation Error for Empty Section */}
                  {sectionItemsError && (
                    <div 
                      className="validation-error-container p-3 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-lg"
                      id={`section-${section.id}-error`}
                      role="alert"
                    >
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        {sectionItemsError}
                      </p>
                    </div>
                  )}

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
                    aria-label={`Add ${itemType === 'ingredient' ? 'ingredient' : 'step'} to ${section.name}`}
                  >
                    {isAddingItem[section.id] ? (
                      <Loader2 className="h-4 w-4 mr-2 section-spinner" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    {addItemLabel || defaultAddItemLabel}
                  </Button>
                </div>
              </div>
            );
          })
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