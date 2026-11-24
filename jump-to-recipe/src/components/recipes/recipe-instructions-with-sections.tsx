'use client';

import { useState } from 'react';
import { useFieldArray, Control, FieldValues, UseFormWatch, FieldErrors, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { Clock, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormPanel } from '@/components/recipes/form-panel';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

import { SectionManager, Section } from '@/components/sections/section-manager';
import type { Instruction } from '@/types/recipe';
import type { InstructionSection } from '@/types/sections';
import { validateSectionName } from '@/lib/validations/recipe';
import { getNextPosition } from '@/lib/section-position-utils';

interface RecipeInstructionsWithSectionsProps<TFieldValues extends FieldValues, TTransformedValues> {
  control: Control<TFieldValues, unknown, TTransformedValues>;
  watch: UseFormWatch<any>;
  errors?: FieldErrors<any>;
  setError?: UseFormSetError<any>;
  clearErrors?: UseFormClearErrors<any>;
  isLoading?: boolean;
  validationErrors?: Map<string, string>;
  onValidate?: () => void;
  onFieldChange?: () => void;
}

// Generic over the caller's form: react-hook-form 7.89's Control is invariant in its
// field values, so Control<SpecificForm> no longer assigns to Control<any>.
export function RecipeInstructionsWithSections<TFieldValues extends FieldValues, TTransformedValues = TFieldValues>({
  control: typedControl,
  watch,
  errors,
  setError,
  clearErrors,
  isLoading = false,
  validationErrors,
  onValidate,
  onFieldChange,
}: RecipeInstructionsWithSectionsProps<TFieldValues, TTransformedValues>) {
  // Field paths below are built dynamically, so widen once for the internals.
  const control = typedControl as unknown as Control<FieldValues>;
  const [useSections, setUseSections] = useState(false);

  // Field arrays for both sectioned and non-sectioned modes
  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
    replace: replaceInstructions,
  } = useFieldArray({
    control,
    name: 'instructions',
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
    update: updateSection,
    replace: replaceSections,
  } = useFieldArray({
    control,
    name: 'instructionSections',
  });

  // Watch for changes to determine if sections are being used
  const instructionSections = watch('instructionSections') || [];
  const instructions = watch('instructions') || [];

  // Auto-detect if sections should be used based on existing data
  const shouldUseSections = instructionSections.length > 0 || useSections;

  // Note: We don't sync flat instructions with sections automatically to prevent infinite loops
  // The form submission will handle converting sections to the final format

  const handleToggleSections = () => {
    if (!shouldUseSections) {
      // Convert flat instructions to sections
      if (instructions.length > 0) {
        const defaultSection: InstructionSection = {
          id: uuidv4(),
          name: 'Instructions',
          order: 0,
          // Preserve order: map instructions with their current array index as position
          items: instructions.map((instruction: Instruction, index: number) => ({
            ...instruction,
            position: index, // Explicitly assign position based on current order
          })),
        };
        appendSection(defaultSection);
      } else {
        // Create an empty section if no instructions exist
        const emptySection: InstructionSection = {
          id: uuidv4(),
          name: 'Instructions',
          order: 0,
          items: [],
        };
        appendSection(emptySection);
      }
      setUseSections(true);
    } else {
      // Convert sections back to flat instructions
      // Preserve order: first by section order, then by instruction position within each section
      
      // Sort sections by their order property
      const sortedSections = [...instructionSections].sort(
        (a: InstructionSection, b: InstructionSection) => a.order - b.order
      );
      
      // Flatten instructions while preserving order
      const allInstructions = sortedSections.flatMap((section: InstructionSection) => {
        // Sort items within each section by position (if available) or array index
        const sortedItems = [...section.items].sort((a: any, b: any) => {
          const posA = typeof a.position === 'number' ? a.position : section.items.indexOf(a);
          const posB = typeof b.position === 'number' ? b.position : section.items.indexOf(b);
          return posA - posB;
        });
        
        // Keep all properties including position (Requirement 3.1, 3.2, 4.4)
        return sortedItems;
      });
      
      // Reindex positions for flat list (global scope) and renumber steps
      const reindexedInstructions = allInstructions.map((item: any, index: number) => ({
        ...item,
        position: index,
        step: index + 1,
      }));
      
      // Clear sections using replace method
      replaceSections([]);
      
      // Replace flat instructions with all instructions from sections
      if (reindexedInstructions.length > 0) {
        replaceInstructions(reindexedInstructions);
      } else {
        // Ensure at least one empty instruction exists with position
        replaceInstructions([{
          id: uuidv4(),
          step: 1,
          content: '',
          duration: undefined,
          position: 0,
        }]);
      }
      
      setUseSections(false);
    }
  };

  const handleSectionsChange = (newSections: Section<Instruction>[]) => {
    // Clear any existing section errors
    if (clearErrors) {
      clearErrors('instructionSections');
    }

    // Check if we actually need to update to prevent infinite loops
    const currentSections = instructionSections || [];
    const sectionsChanged = 
      currentSections.length !== newSections.length ||
      currentSections.some((current: InstructionSection, index: number) => 
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
  const validateSections = (sections: Section<Instruction>[]) => {
    if (!setError) return;

    sections.forEach((section, index) => {
      // Validate section name
      if (!section.name.trim()) {
        setError(`instructionSections.${index}.name`, {
          type: 'manual',
          message: 'Section name cannot be empty',
        });
      }

      // Validate instructions in section
      section.items.forEach((instruction, itemIndex) => {
        if (!instruction.content.trim()) {
          setError(`instructionSections.${index}.items.${itemIndex}.content`, {
            type: 'manual',
            message: 'Instruction content is required',
          });
        }
        if (instruction.duration !== undefined && instruction.duration < 0) {
          setError(`instructionSections.${index}.items.${itemIndex}.duration`, {
            type: 'manual',
            message: 'Duration must be non-negative',
          });
        }
      });
    });
  };

  const handleAddInstruction = (sectionId: string) => {
    const sectionIndex = instructionSections.findIndex((s: InstructionSection) => s.id === sectionId);
    if (sectionIndex >= 0) {
      const section = instructionSections[sectionIndex];
      const newStep = section.items.length + 1;
      const nextPosition = getNextPosition(section.items);
      
      const newInstruction: Instruction & { position: number } = {
        id: uuidv4(),
        step: newStep,
        content: '',
        duration: undefined,
        position: nextPosition,
      };

      const updatedSection = {
        ...section,
        items: [...section.items, newInstruction],
      };

      updateSection(sectionIndex, updatedSection);

      // Clear any empty section errors since we're adding an item
      if (clearErrors) {
        clearErrors(`instructionSections.${sectionIndex}`);
      }
    }
  };

  const handleRemoveInstruction = (sectionId: string, instructionId: string) => {
    const sectionIndex = instructionSections.findIndex((s: InstructionSection) => s.id === sectionId);
    if (sectionIndex >= 0) {
      const section = instructionSections[sectionIndex];
      const updatedItems = section.items.filter((item: Instruction) => item.id !== instructionId);
      
      // Renumber steps and positions after removal
      const renumberedItems = updatedItems.map((item: Instruction, index: number) => ({
        ...item,
        step: index + 1,
        position: index,
      }));

      const updatedSection = {
        ...section,
        items: renumberedItems,
      };

      updateSection(sectionIndex, updatedSection);

      // Clear errors for the removed instruction
      if (clearErrors) {
        const itemIndex = section.items.findIndex((item: Instruction) => item.id === instructionId);
        if (itemIndex >= 0) {
          clearErrors(`instructionSections.${sectionIndex}.items.${itemIndex}`);
        }
      }

      // If section becomes empty, validate it
      if (updatedSection.items.length === 0 && setError) {
        setError(`instructionSections.${sectionIndex}`, {
          type: 'manual',
          message: 'Section cannot be empty',
        });
      }
    }
  };

  const renderInstructionItem = (instruction: Instruction, index: number, sectionId: string) => {
    const sectionIndex = instructionSections.findIndex((s: InstructionSection) => s.id === sectionId);
    const fieldBaseName = `instructionSections.${sectionIndex}.items.${index}`;
    // Like flat mode, a recipe must keep at least one step
    const isOnlyStep =
      instructionSections.reduce(
        (total: number, section: InstructionSection) => total + section.items.length,
        0
      ) === 1;

    return (
      <StepLayout key={instruction.id} number={instruction.step}>
        <FormField
          control={control}
          name={`${fieldBaseName}.content`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Describe this step..."
                  aria-label={`Step ${instruction.step}`}
                  {...field}
                  onBlur={(e) => {
                    field.onBlur();
                    // Clear error if field becomes valid
                    if (e.target.value.trim() && clearErrors) {
                      clearErrors(`${fieldBaseName}.content`);
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
        <div className="flex items-center justify-between gap-2">
          <FormField
            control={control}
            name={`${fieldBaseName}.duration`}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Duration (min)"
                      aria-label={`Step ${instruction.step} duration in minutes`}
                      className="h-8 w-36 text-sm"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        field.onChange(value);
                        // Clear error if value becomes valid
                        if ((value === undefined || value >= 0) && clearErrors) {
                          clearErrors(`${fieldBaseName}.duration`);
                        }
                      }}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <DeleteButton
            onDelete={() => handleRemoveInstruction(sectionId, instruction.id)}
            disabled={isOnlyStep || isLoading}
            ariaLabel={`Delete step ${instruction.step}`}
          />
        </div>
      </StepLayout>
    );
  };

  const renderFlatInstructions = () => (
    <div className="space-y-4">
      {instructionFields.map((field, index) => (
        <StepLayout key={field.id} number={index + 1}>
          <FormField
            control={control}
            name={`instructions.${index}.content`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Describe this step..."
                    aria-label={`Step ${index + 1}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between gap-2">
            <FormField
              control={control}
              name={`instructions.${index}.duration`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Duration (min)"
                        aria-label={`Step ${index + 1} duration in minutes`}
                        className="h-8 w-36 text-sm"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DeleteButton
              onDelete={() => removeInstruction(index)}
              disabled={instructionFields.length === 1 || isLoading}
              ariaLabel={`Delete step ${index + 1}`}
            />
          </div>
        </StepLayout>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          // Calculate next position based on current instructions
          const nextPosition = instructionFields.length;
          appendInstruction({
            id: uuidv4(),
            step: instructionFields.length + 1,
            content: '',
            duration: undefined,
            position: nextPosition,
          });
        }}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add step
      </Button>
    </div>
  );

  const stepCount = shouldUseSections
    ? instructionSections.reduce((total: number, section: InstructionSection) => total + section.items.length, 0)
    : instructions.length;
  const runningTotal = [
    `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}`,
    shouldUseSections && `${instructionSections.length} ${instructionSections.length === 1 ? 'section' : 'sections'}`,
  ].filter(Boolean).join(' · ');

  return (
    <FormPanel
      title="Method"
      description="Split the steps into sections that read naturally while cooking."
      aside={
        <>
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {runningTotal}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleSections}
            disabled={isLoading}
          >
            {shouldUseSections ? 'Use Simple List' : 'Organize into Sections'}
          </Button>
        </>
      }
    >
      <div>
        {shouldUseSections ? (
          <div className="space-y-4">
            {/* Display section-level errors */}
            {errors?.instructionSections && (
              <div className="text-sm text-destructive">
                {typeof errors.instructionSections.message === 'string' && (
                  <p>{errors.instructionSections.message}</p>
                )}
              </div>
            )}
            
            <SectionManager
              sections={instructionSections}
              onSectionsChange={handleSectionsChange}
              onAddItem={handleAddInstruction}
              onRemoveItem={handleRemoveInstruction}
              renderItem={renderInstructionItem}
              itemType="instruction"
              addSectionLabel="Add method section"
              addItemLabel="Add step"
              isLoading={isLoading}
              validationErrors={validationErrors}
              onValidate={onValidate}
            />
          </div>
        ) : (
          renderFlatInstructions()
        )}
      </div>
    </FormPanel>
  );
}

// Outlined number badge beside the step's fields
function StepLayout({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold text-primary"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </div>
  );
}
