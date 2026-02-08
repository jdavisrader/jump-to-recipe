'use client';

import { useState, useEffect, useRef } from 'react';
import { useFieldArray, Control, UseFormWatch, FieldErrors, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from '@hello-pangea/dnd';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { DragHandle } from '@/components/ui/drag-handle';
import { DeleteButton } from '@/components/ui/delete-button';

import { SectionManager, Section } from '@/components/sections/section-manager';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';
import { validateSectionName } from '@/lib/validations/recipe';
import { reorderWithinSection, moveBetweenSections, getNextPosition } from '@/lib/section-position-utils';
import {
  SnapshotManager,
  validateDragDestination,
  detectPositionConflicts,
  autoCorrectPositions,
  validateIngredientData,
  validateSectionData,
  showDragErrorToast,
  recoverFromDragError,
  DragOperationError,
  DragErrorType,
  type IngredientSnapshot,
} from '@/lib/drag-error-recovery';

import './drag-feedback.css';

interface RecipeIngredientsWithSectionsProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  errors?: FieldErrors<any>;
  setError?: UseFormSetError<any>;
  clearErrors?: UseFormClearErrors<any>;
  isLoading?: boolean;
  validationErrors?: Map<string, string>;
  onValidate?: () => void;
  onFieldChange?: () => void;
}

export function RecipeIngredientsWithSections({
  control,
  watch,
  errors,
  setError,
  clearErrors,
  isLoading = false,
  validationErrors,
  onValidate,
  onFieldChange,
}: RecipeIngredientsWithSectionsProps) {
  const [useSections, setUseSections] = useState(false);
  const [dragAnnouncement, setDragAnnouncement] = useState<string>('');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Snapshot manager for error recovery
  const snapshotManagerRef = useRef(new SnapshotManager());
  const snapshotManager = snapshotManagerRef.current;

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      // Check for touch support
      const hasTouch = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 || 
                       (navigator as any).msMaxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
    };

    checkTouchDevice();

    // Also listen for changes (e.g., when connecting/disconnecting touch devices)
    window.addEventListener('touchstart', checkTouchDevice, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouchDevice);
    };
  }, []);

  // Field arrays for both sectioned and non-sectioned modes
  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    replace: replaceIngredients,
  } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
    update: updateSection,
    replace: replaceSections,
  } = useFieldArray({
    control,
    name: 'ingredientSections',
  });

  // Watch for changes to determine if sections are being used
  const ingredientSections = watch('ingredientSections') || [];
  const ingredients = watch('ingredients') || [];

  // Auto-detect if sections should be used based on existing data
  const shouldUseSections = ingredientSections.length > 0 || useSections;

  // Note: We don't sync flat ingredients with sections automatically to prevent infinite loops
  // The form submission will handle converting sections to the final format

  const handleToggleSections = () => {
    if (!shouldUseSections) {
      // Convert flat ingredients to sections
      // Preserve ingredient order by maintaining array positions
      if (ingredients.length > 0) {
        const defaultSection: IngredientSection = {
          id: uuidv4(),
          name: 'Ingredients',
          order: 0,
          // Preserve order: map ingredients with their current array index as position
          items: ingredients.map((ingredient: Ingredient, index: number) => ({
            ...ingredient,
            position: index, // Explicitly assign position based on current order
          })),
        };
        appendSection(defaultSection);
      } else {
        // Create an empty section if no ingredients exist
        const emptySection: IngredientSection = {
          id: uuidv4(),
          name: 'Ingredients',
          order: 0,
          items: [],
        };
        appendSection(emptySection);
      }
      setUseSections(true);
    } else {
      // Convert sections back to flat ingredients
      // Preserve order: first by section order, then by ingredient position within each section
      
      // Sort sections by their order property
      const sortedSections = [...ingredientSections].sort(
        (a: IngredientSection, b: IngredientSection) => a.order - b.order
      );

      // Flatten ingredients while preserving order
      const allIngredients = sortedSections.flatMap((section: IngredientSection) => {
        // Sort items within each section by position (if available) or array index
        const sortedItems = [...section.items].sort((a: any, b: any) => {
          const posA = typeof a.position === 'number' ? a.position : section.items.indexOf(a);
          const posB = typeof b.position === 'number' ? b.position : section.items.indexOf(b);
          return posA - posB;
        });
        
        // Create copies and remove position property if it exists (not needed in flat mode)
        return sortedItems.map((item: any) => {
          const { position, ...itemWithoutPosition } = item;
          return itemWithoutPosition;
        });
      });

      // Clear sections using replace method
      replaceSections([]);

      // Replace flat ingredients with all ingredients from sections
      if (allIngredients.length > 0) {
        replaceIngredients(allIngredients);
      } else {
        // Ensure at least one empty ingredient exists
        replaceIngredients([{
          id: uuidv4(),
          name: '',
          amount: 0,
          unit: '',
          displayAmount: '',
          notes: '',
        }]);
      }

      setUseSections(false);
    }
  };

  const handleSectionsChange = (newSections: Section<Ingredient>[]) => {
    // Clear any existing section errors
    if (clearErrors) {
      clearErrors('ingredientSections');
    }

    // Check if we actually need to update to prevent infinite loops
    const currentSections = ingredientSections || [];
    const sectionsChanged =
      currentSections.length !== newSections.length ||
      currentSections.some((current: IngredientSection, index: number) =>
        !newSections[index] ||
        current.id !== newSections[index].id ||
        current.name !== newSections[index].name ||
        current.order !== newSections[index].order ||
        current.items.length !== newSections[index].items.length
      );

    if (!sectionsChanged) {
      return; // No changes needed
    }

    // Update the form with new sections efficiently
    // Replace all sections with validated new sections
    const validatedSections = newSections.map((section) => ({
      ...section,
      name: validateSectionName(section.name),
    }));

    replaceSections(validatedSections);

    // Validate sections after update
    validateSections(newSections);
    
    // Trigger validation callback if provided
    if (onValidate) {
      onValidate();
    }
  };

  // Validation function for sections
  const validateSections = (sections: Section<Ingredient>[]) => {
    if (!setError) return;

    sections.forEach((section, index) => {
      // Validate section name
      if (!section.name.trim()) {
        setError(`ingredientSections.${index}.name`, {
          type: 'manual',
          message: 'Section name cannot be empty',
        });
      }

      // Validate ingredients in section
      section.items.forEach((ingredient, itemIndex) => {
        if (!ingredient.name.trim()) {
          setError(`ingredientSections.${index}.items.${itemIndex}.name`, {
            type: 'manual',
            message: 'Ingredient name is required',
          });
        }
        if (ingredient.amount < 0) {
          setError(`ingredientSections.${index}.items.${itemIndex}.amount`, {
            type: 'manual',
            message: 'Amount must be non-negative',
          });
        }
      });
    });
  };

  const handleAddIngredient = (sectionId: string) => {
    const sectionIndex = ingredientSections.findIndex((s: IngredientSection) => s.id === sectionId);
    if (sectionIndex >= 0) {
      const section = ingredientSections[sectionIndex];
      const nextPosition = getNextPosition(section.items);
      
      const newIngredient: Ingredient & { position: number } = {
        id: uuidv4(),
        name: '',
        amount: 0,
        unit: '',
        displayAmount: '',
        notes: '',
        position: nextPosition,
      };

      const updatedSection = {
        ...section,
        items: [...section.items, newIngredient],
      };

      updateSection(sectionIndex, updatedSection);

      // Clear any empty section errors since we're adding an item
      if (clearErrors) {
        clearErrors(`ingredientSections.${sectionIndex}`);
      }
    }
  };

  const handleRemoveIngredient = (sectionId: string, ingredientId: string) => {
    const sectionIndex = ingredientSections.findIndex((s: IngredientSection) => s.id === sectionId);
    if (sectionIndex >= 0) {
      const section = ingredientSections[sectionIndex];
      
      // Remove the ingredient and reindex positions (Requirement 6.4)
      const remainingItems = section.items.filter((item: Ingredient) => item.id !== ingredientId);
      
      // Reindex positions to maintain sequential order
      const reindexedItems = remainingItems.map((item: Ingredient, index: number) => ({
        ...item,
        // Position is implicit in array order, but we track it for drag-and-drop
      }));
      
      const updatedSection = {
        ...section,
        items: reindexedItems,
      };

      updateSection(sectionIndex, updatedSection);

      // Clear errors for the removed ingredient
      if (clearErrors) {
        const itemIndex = section.items.findIndex((item: Ingredient) => item.id === ingredientId);
        if (itemIndex >= 0) {
          clearErrors(`ingredientSections.${sectionIndex}.items.${itemIndex}`);
        }
      }

      // If section becomes empty, validate it
      if (updatedSection.items.length === 0 && setError) {
        setError(`ingredientSections.${sectionIndex}`, {
          type: 'manual',
          message: 'Section cannot be empty',
        });
      }
    }
  };

  // Handler for flat list drag-and-drop
  const handleFlatListDragStart = (start: DragStart) => {
    setIsDragging(true);
    
    // Create snapshot before drag operation
    snapshotManager.createSnapshot(ingredients, undefined, 'flat');
    
    const draggedIndex = start.source.index;
    const draggedIngredient = ingredients[draggedIndex];
    setDragAnnouncement(
      `Started dragging ${draggedIngredient?.name || 'ingredient'} from position ${draggedIndex + 1}`
    );
  };

  const handleFlatListDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { source, destination } = result;

    // Validate destination
    const validation = validateDragDestination(destination, undefined, ingredients);
    if (!validation.isValid) {
      if (validation.error) {
        showDragErrorToast(validation.error);
      }
      setDragAnnouncement('Drag cancelled - invalid destination');
      return;
    }

    // Dropped outside the list
    if (!destination) {
      setDragAnnouncement('Drag cancelled');
      return;
    }

    // No movement
    if (source.index === destination.index) {
      setDragAnnouncement('Ingredient returned to original position');
      return;
    }

    try {
      // Validate current ingredient data
      const dataValidation = validateIngredientData(ingredients);
      if (!dataValidation.isValid) {
        throw new DragOperationError(
          DragErrorType.DATA_CORRUPTION,
          'Invalid ingredient data detected',
          { errors: dataValidation.errors }
        );
      }

      // Get current ingredients with positions
      const currentIngredients = ingredients.map((ing: Ingredient, index: number) => ({
        ...ing,
        position: index,
      }));

      const movedIngredient = currentIngredients[source.index];

      // Reorder using position utility
      const reorderedIngredients = reorderWithinSection(
        currentIngredients,
        source.index,
        destination.index
      );

      // Check for position conflicts
      const conflicts = detectPositionConflicts(reorderedIngredients);
      if (conflicts.hasConflicts) {
        console.warn('Position conflicts detected, auto-correcting:', conflicts);
        const corrected = autoCorrectPositions(reorderedIngredients);
        
        // Remove position property before updating form
        const ingredientsWithoutPosition = corrected.map(({ position, ...ing }) => ing);
        replaceIngredients(ingredientsWithoutPosition);
      } else {
        // Remove position property before updating form (it's implicit in array order)
        const ingredientsWithoutPosition = reorderedIngredients.map(({ position, ...ing }) => ing);
        replaceIngredients(ingredientsWithoutPosition);
      }

      // Announce the change
      setDragAnnouncement(
        `Moved ${movedIngredient.name || 'ingredient'} from position ${source.index + 1} to position ${destination.index + 1}`
      );

      // Trigger validation if provided
      if (onValidate) {
        onValidate();
      }
    } catch (error) {
      // Recover from error
      const snapshot = snapshotManager.getLatestSnapshot();
      if (snapshot && snapshot.ingredients) {
        replaceIngredients(snapshot.ingredients);
        setDragAnnouncement('Operation failed - changes reverted');
      }
      
      if (error instanceof DragOperationError) {
        showDragErrorToast(error);
      } else {
        showDragErrorToast(
          new DragOperationError(
            DragErrorType.DATA_CORRUPTION,
            'Failed to reorder ingredients',
            { error }
          )
        );
      }
    }
  };

  // Handler for sectioned list drag-and-drop (within section and cross-section)
  const handleSectionedDragStart = (start: DragStart) => {
    setIsDragging(true);
    
    // Create snapshot before drag operation
    snapshotManager.createSnapshot(undefined, ingredientSections, 'sectioned');
    
    const sourceSectionId = start.source.droppableId.replace('section-', '');
    const sourceSectionIndex = ingredientSections.findIndex(
      (s: IngredientSection) => s.id === sourceSectionId
    );
    
    if (sourceSectionIndex >= 0) {
      const sourceSection = ingredientSections[sourceSectionIndex];
      const draggedIngredient = sourceSection.items[start.source.index];
      setDragAnnouncement(
        `Started dragging ${draggedIngredient?.name || 'ingredient'} from ${sourceSection.name}`
      );
    }
  };

  const handleSectionedDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { source, destination } = result;

    // Validate destination
    const validation = validateDragDestination(destination, ingredientSections, undefined);
    if (!validation.isValid) {
      if (validation.error) {
        showDragErrorToast(validation.error);
      }
      setDragAnnouncement('Drag cancelled - invalid destination');
      return;
    }

    // Dropped outside any droppable area
    if (!destination) {
      setDragAnnouncement('Drag cancelled');
      return;
    }

    // Extract section ID from droppableId (format: "section-{sectionId}")
    const sourceSectionId = source.droppableId.replace('section-', '');
    const destSectionId = destination.droppableId.replace('section-', '');

    // No movement (same section and same position)
    if (sourceSectionId === destSectionId && source.index === destination.index) {
      setDragAnnouncement('Ingredient returned to original position');
      return;
    }

    try {
      // Validate section data
      const sectionValidation = validateSectionData(ingredientSections);
      if (!sectionValidation.isValid) {
        throw new DragOperationError(
          DragErrorType.DATA_CORRUPTION,
          'Invalid section data detected',
          { errors: sectionValidation.errors }
        );
      }

      // Find source and destination sections
      const sourceSectionIndex = ingredientSections.findIndex(
        (s: IngredientSection) => s.id === sourceSectionId
      );
      const destSectionIndex = ingredientSections.findIndex(
        (s: IngredientSection) => s.id === destSectionId
      );

      if (sourceSectionIndex < 0) {
        throw new DragOperationError(
          DragErrorType.MISSING_SECTION,
          'Source section not found',
          { sourceSectionId }
        );
      }

      if (destSectionIndex < 0) {
        throw new DragOperationError(
          DragErrorType.MISSING_SECTION,
          'Destination section not found',
          { destSectionId }
        );
      }

      const sourceSection = ingredientSections[sourceSectionIndex];
      const destSection = ingredientSections[destSectionIndex];
      const movedIngredient = sourceSection.items[source.index];

      // Handle within-section reordering
      if (sourceSectionId === destSectionId) {
        // Get current items with positions
        const currentItems = sourceSection.items.map((item: Ingredient, index: number) => ({
          ...item,
          position: index,
        }));

        // Reorder using position utility
        const reorderedItems = reorderWithinSection(
          currentItems,
          source.index,
          destination.index
        );

        // Check for position conflicts
        const conflicts = detectPositionConflicts(reorderedItems);
        let finalItems = reorderedItems;
        
        if (conflicts.hasConflicts) {
          console.warn('Position conflicts detected in section, auto-correcting:', conflicts);
          finalItems = autoCorrectPositions(reorderedItems);
        }

        // Remove position property before updating form (it's implicit in array order)
        const itemsWithoutPosition = finalItems.map(({ position, ...item }) => item);

        // Update the section with reordered items
        const updatedSection = {
          ...sourceSection,
          items: itemsWithoutPosition,
        };

        updateSection(sourceSectionIndex, updatedSection);

        // Announce the change
        setDragAnnouncement(
          `Moved ${movedIngredient.name || 'ingredient'} within ${sourceSection.name} from position ${source.index + 1} to position ${destination.index + 1}`
        );

        // Trigger validation if provided
        if (onValidate) {
          onValidate();
        }
      } else {
        // Handle cross-section move
        const sourceItems = sourceSection.items.map((item: Ingredient, index: number) => ({
          ...item,
          position: index,
        }));
        const destItems = destSection.items.map((item: Ingredient, index: number) => ({
          ...item,
          position: index,
        }));

        // Move item between sections using position utility
        const { sourceItems: updatedSourceItems, destItems: updatedDestItems } = moveBetweenSections(
          sourceItems,
          destItems,
          source.index,
          destination.index
        );

        // Check for position conflicts in both sections
        const sourceConflicts = detectPositionConflicts(updatedSourceItems);
        const destConflicts = detectPositionConflicts(updatedDestItems);
        
        let finalSourceItems = updatedSourceItems;
        let finalDestItems = updatedDestItems;
        
        if (sourceConflicts.hasConflicts) {
          console.warn('Position conflicts in source section, auto-correcting:', sourceConflicts);
          finalSourceItems = autoCorrectPositions(updatedSourceItems);
        }
        
        if (destConflicts.hasConflicts) {
          console.warn('Position conflicts in dest section, auto-correcting:', destConflicts);
          finalDestItems = autoCorrectPositions(updatedDestItems);
        }

        // Remove position property before updating form (it's implicit in array order)
        const sourceItemsWithoutPosition = finalSourceItems.map(({ position, ...item }) => item);
        const destItemsWithoutPosition = finalDestItems.map(({ position, ...item }) => item);

        // Update both sections
        const updatedSourceSection = {
          ...sourceSection,
          items: sourceItemsWithoutPosition,
        };
        const updatedDestSection = {
          ...destSection,
          items: destItemsWithoutPosition,
        };

        // Update both sections in the form
        // We need to update them in a way that doesn't cause race conditions
        const updatedSections = [...ingredientSections];
        updatedSections[sourceSectionIndex] = updatedSourceSection;
        updatedSections[destSectionIndex] = updatedDestSection;

        // Replace all sections at once to avoid race conditions
        replaceSections(updatedSections);

        // Announce the change
        setDragAnnouncement(
          `Moved ${movedIngredient.name || 'ingredient'} from ${sourceSection.name} to ${destSection.name}`
        );

        // Clear any errors for the moved ingredient
        if (clearErrors) {
          clearErrors(`ingredientSections.${sourceSectionIndex}.items.${source.index}`);
        }

        // Trigger validation if provided
        if (onValidate) {
          onValidate();
        }
      }
    } catch (error) {
      // Recover from error
      const snapshot = snapshotManager.getLatestSnapshot();
      if (snapshot && snapshot.sections) {
        replaceSections(snapshot.sections);
        setDragAnnouncement('Operation failed - changes reverted');
      }
      
      if (error instanceof DragOperationError) {
        showDragErrorToast(error);
      } else {
        showDragErrorToast(
          new DragOperationError(
            DragErrorType.DATA_CORRUPTION,
            'Failed to move ingredient',
            { error }
          )
        );
      }
    }
  };

  const renderIngredientItem = (ingredient: Ingredient, index: number, sectionId: string) => {
    const sectionIndex = ingredientSections.findIndex((s: IngredientSection) => s.id === sectionId);
    const fieldBaseName = `ingredientSections.${sectionIndex}.items.${index}`;
    const section = ingredientSections[sectionIndex];

    return (
      <Draggable
        key={ingredient.id}
        draggableId={`${sectionId}-${ingredient.id}`}
        index={index}
        isDragDisabled={isLoading}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            role="listitem"
            aria-label={`Ingredient ${index + 1}: ${ingredient.name || 'unnamed'} in ${section?.name || 'section'}`}
            className={`flex gap-2 items-start ${
              snapshot.isDragging
                ? 'opacity-60 bg-card shadow-2xl rounded-lg border-2 border-primary scale-105 z-50'
                : 'bg-transparent'
            }`}
            style={provided.draggableProps.style}
          >
            {/* Drag Handle */}
            <div {...provided.dragHandleProps}>
              <DragHandle
                isDragging={snapshot.isDragging}
                disabled={isLoading}
                ariaLabel={`Drag to reorder ${ingredient.name || 'ingredient'}`}
              />
            </div>

            {/* Ingredient Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
              {/* Field order: Quantity, Unit, Ingredient Name, Notes */}
              <FormField
                control={control}
                name={`${fieldBaseName}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Quantity"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          field.onChange(value);
                          // Clear error if value becomes valid
                          if (value >= 0 && clearErrors) {
                            clearErrors(`${fieldBaseName}.amount`);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="fl oz">fl oz</SelectItem>
                        <SelectItem value="pint">pint</SelectItem>
                        <SelectItem value="quart">quart</SelectItem>
                        <SelectItem value="gallon">gallon</SelectItem>
                        <SelectItem value="pinch">pinch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Ingredient name"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          // Clear error if field becomes valid
                          if (e.target.value.trim() && clearErrors) {
                            clearErrors(`${fieldBaseName}.name`);
                          }
                          // Trigger validation on blur
                          if (onValidate) {
                            onValidate();
                          }
                        }}
                        onChange={(e) => {
                          field.onChange(e);
                          // Trigger field change callback
                          if (onFieldChange) {
                            onFieldChange();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Notes (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delete Button */}
            <DeleteButton
              onDelete={() => handleRemoveIngredient(sectionId, ingredient.id)}
              disabled={isLoading}
              ariaLabel={`Delete ${ingredient.name || 'ingredient'}`}
            />
          </div>
        )}
      </Draggable>
    );
  };

  const renderFlatIngredients = () => (
    <DragDropContext 
      onDragStart={handleFlatListDragStart}
      onDragEnd={handleFlatListDragEnd}
    >
      <Droppable droppableId="flat-ingredients-list">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            role="list"
            aria-label="Ingredient list - drag to reorder"
            aria-describedby="drag-instructions"
            className={`space-y-4 transition-all duration-200 ${
              snapshot.isDraggingOver
                ? 'bg-accent/30 rounded-lg p-4 ring-2 ring-primary ring-offset-2'
                : 'p-2'
            } ${isTouchDevice ? 'touch-device' : ''}`}
          >
            {ingredientFields.map((field, index) => (
              <Draggable
                key={field.id}
                draggableId={field.id}
                index={index}
                isDragDisabled={isLoading}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    role="listitem"
                    aria-label={`Ingredient ${index + 1}: ${ingredients[index]?.name || 'unnamed'}`}
                    className={`flex gap-2 items-start ${
                      snapshot.isDragging
                        ? 'opacity-60 bg-card shadow-2xl rounded-lg border-2 border-primary scale-105 z-50'
                        : 'bg-transparent'
                    }`}
                    style={provided.draggableProps.style}
                  >
                    {/* Drag Handle */}
                    <div {...provided.dragHandleProps}>
                      <DragHandle
                        isDragging={snapshot.isDragging}
                        disabled={isLoading}
                        ariaLabel={`Drag to reorder ${ingredients[index]?.name || 'ingredient'}`}
                      />
                    </div>

                    {/* Ingredient Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                      {/* Field order: Quantity, Unit, Ingredient Name, Notes */}
                      <FormField
                        control={control}
                        name={`ingredients.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Quantity"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`ingredients.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="l">l</SelectItem>
                                <SelectItem value="tsp">tsp</SelectItem>
                                <SelectItem value="tbsp">tbsp</SelectItem>
                                <SelectItem value="cup">cup</SelectItem>
                                <SelectItem value="oz">oz</SelectItem>
                                <SelectItem value="lb">lb</SelectItem>
                                <SelectItem value="fl oz">fl oz</SelectItem>
                                <SelectItem value="pint">pint</SelectItem>
                                <SelectItem value="quart">quart</SelectItem>
                                <SelectItem value="gallon">gallon</SelectItem>
                                <SelectItem value="pinch">pinch</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`ingredients.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Ingredient name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`ingredients.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Notes (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Delete Button */}
                    <DeleteButton
                      onDelete={() => removeIngredient(index)}
                      disabled={ingredientFields.length === 1 || isLoading}
                      ariaLabel={`Delete ${ingredients[index]?.name || 'ingredient'}`}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Position is implicit in array order for flat lists
                // It will be assigned during form submission if needed
                appendIngredient({
                  id: uuidv4(),
                  name: '',
                  amount: 0,
                  unit: '',
                  displayAmount: '',
                  notes: '',
                });
              }}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Ingredients</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleSections}
          disabled={isLoading}
          aria-label={shouldUseSections ? 'Convert to simple list' : 'Organize into sections'}
        >
          {shouldUseSections ? 'Use Simple List' : 'Organize into Sections'}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Drag instructions for screen readers and keyboard users */}
        <div id="drag-instructions" className="sr-only">
          To reorder ingredients, use the drag handle. 
          {isTouchDevice 
            ? 'Long press the drag handle, then drag to reorder.' 
            : 'Click and hold the drag handle, then drag to reorder. You can also use keyboard: Tab to the drag handle, press Space to pick up, use Arrow keys to move, and Space again to drop.'}
        </div>

        {shouldUseSections ? (
          <DragDropContext 
            onDragStart={handleSectionedDragStart}
            onDragEnd={handleSectionedDragEnd}
          >
            <div className="space-y-4" role="region" aria-label="Ingredient sections">
              {/* Display section-level errors */}
              {errors?.ingredientSections && (
                <div className="text-sm text-destructive" role="alert">
                  {typeof errors.ingredientSections.message === 'string' && (
                    <p>{errors.ingredientSections.message}</p>
                  )}
                </div>
              )}

              <SectionManager
                sections={ingredientSections}
                onSectionsChange={handleSectionsChange}
                onAddItem={handleAddIngredient}
                onRemoveItem={handleRemoveIngredient}
                renderItem={renderIngredientItem}
                itemType="ingredient"
                addSectionLabel="Add Ingredient Section"
                addItemLabel="Add Ingredient"
                isLoading={isLoading}
                validationErrors={validationErrors}
                onValidate={onValidate}
                enableDragDrop={true}
              />
            </div>
          </DragDropContext>
        ) : (
          renderFlatIngredients()
        )}

        {/* Screen reader announcements for drag operations */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {dragAnnouncement}
        </div>

        {/* Touch device indicator for better UX */}
        {isTouchDevice && isDragging && (
          <div 
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            Drag to reorder
          </div>
        )}
      </CardContent>
    </Card>
  );
}