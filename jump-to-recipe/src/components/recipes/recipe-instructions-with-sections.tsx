'use client';

import { useState } from 'react';
import { useFieldArray, Control, UseFormWatch, FieldErrors, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { Plus, Minus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface RecipeInstructionsWithSectionsProps {
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

export function RecipeInstructionsWithSections({
  control,
  watch,
  errors,
  setError,
  clearErrors,
  isLoading = false,
  validationErrors,
  onValidate,
  onFieldChange,
}: RecipeInstructionsWithSectionsProps) {
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
          items: instructions.map((instruction: Instruction) => ({ ...instruction })), // Create copies to avoid reference issues
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
      const allInstructions = instructionSections.flatMap((section: InstructionSection) => 
        section.items.map((item: Instruction) => ({ ...item })) // Create copies to avoid reference issues
      );
      
      // Clear sections using replace method
      replaceSections([]);
      
      // Replace flat instructions with all instructions from sections
      if (allInstructions.length > 0) {
        replaceInstructions(allInstructions);
      } else {
        // Ensure at least one empty instruction exists
        replaceInstructions([{
          id: uuidv4(),
          step: 1,
          content: '',
          duration: undefined,
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
      const newInstruction: Instruction = {
        id: uuidv4(),
        step: newStep,
        content: '',
        duration: undefined,
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
      
      // Renumber steps after removal
      const renumberedItems = updatedItems.map((item: Instruction, index: number) => ({
        ...item,
        step: index + 1,
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

    return (
      <div key={instruction.id} className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {instruction.step}
            </span>
            <FormField
              control={control}
              name={`${fieldBaseName}.duration`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      className="w-32"
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name={`${fieldBaseName}.content`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Describe this step..."
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
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleRemoveInstruction(sectionId, instruction.id)}
          disabled={isLoading}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderFlatInstructions = () => (
    <div className="space-y-4">
      {instructionFields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {index + 1}
              </span>
              <FormField
                control={control}
                name={`instructions.${index}.duration`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Duration (min)"
                        className="w-32"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`instructions.${index}.content`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this step..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeInstruction(index)}
            disabled={instructionFields.length === 1 || isLoading}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          appendInstruction({
            id: uuidv4(),
            step: instructionFields.length + 1,
            content: '',
            duration: undefined,
          })
        }
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Instructions</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleSections}
          disabled={isLoading}
        >
          {shouldUseSections ? 'Use Simple List' : 'Organize into Sections'}
        </Button>
      </CardHeader>
      <CardContent>
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
              addSectionLabel="Add Instruction Section"
              addItemLabel="Add Step"
              isLoading={isLoading}
              validationErrors={validationErrors}
              onValidate={onValidate}
            />
          </div>
        ) : (
          renderFlatInstructions()
        )}
      </CardContent>
    </Card>
  );
}