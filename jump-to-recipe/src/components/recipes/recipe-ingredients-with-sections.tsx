'use client';

import { useState } from 'react';
import { useFieldArray, Control, UseFormWatch, FieldErrors, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { Plus, Minus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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

import { SectionManager, Section } from '@/components/sections/section-manager';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';
import { validateSectionName } from '@/lib/validations/recipe';

interface RecipeIngredientsWithSectionsProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  errors?: FieldErrors<any>;
  setError?: UseFormSetError<any>;
  clearErrors?: UseFormClearErrors<any>;
  isLoading?: boolean;
}

export function RecipeIngredientsWithSections({
  control,
  watch,
  errors,
  setError,
  clearErrors,
  isLoading = false,
}: RecipeIngredientsWithSectionsProps) {
  const [useSections, setUseSections] = useState(false);

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
      if (ingredients.length > 0) {
        const defaultSection: IngredientSection = {
          id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: 'Ingredients',
          order: 0,
          items: ingredients.map(ingredient => ({ ...ingredient })), // Create copies to avoid reference issues
        };
        appendSection(defaultSection);
      } else {
        // Create an empty section if no ingredients exist
        const emptySection: IngredientSection = {
          id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: 'Ingredients',
          order: 0,
          items: [],
        };
        appendSection(emptySection);
      }
      setUseSections(true);
    } else {
      // Convert sections back to flat ingredients
      const allIngredients = ingredientSections.flatMap((section: IngredientSection) => 
        section.items.map(item => ({ ...item })) // Create copies to avoid reference issues
      );
      
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
      currentSections.some((current, index) => 
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
      const newIngredient: Ingredient = {
        id: uuidv4(),
        name: '',
        amount: 0,
        unit: '',
        displayAmount: '',
        notes: '',
      };

      const updatedSection = {
        ...ingredientSections[sectionIndex],
        items: [...ingredientSections[sectionIndex].items, newIngredient],
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
      const updatedSection = {
        ...section,
        items: section.items.filter((item: Ingredient) => item.id !== ingredientId),
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

  const renderIngredientItem = (ingredient: Ingredient, index: number, sectionId: string) => {
    const sectionIndex = ingredientSections.findIndex((s: IngredientSection) => s.id === sectionId);
    const fieldBaseName = `ingredientSections.${sectionIndex}.items.${index}`;

    return (
      <div key={ingredient.id} className="flex gap-2 items-start">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
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
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${fieldBaseName}.amount`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Amount"
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleRemoveIngredient(sectionId, ingredient.id)}
          disabled={isLoading}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderFlatIngredients = () => (
    <div className="space-y-4">
      {ingredientFields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
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
              name={`ingredients.${index}.amount`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Amount"
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

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeIngredient(index)}
            disabled={ingredientFields.length === 1 || isLoading}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          appendIngredient({
            id: uuidv4(),
            name: '',
            amount: 0,
            unit: '',
            displayAmount: '',
            notes: '',
          })
        }
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Ingredient
      </Button>
    </div>
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
        >
          {shouldUseSections ? 'Use Simple List' : 'Organize into Sections'}
        </Button>
      </CardHeader>
      <CardContent>
        {shouldUseSections ? (
          <div className="space-y-4">
            {/* Display section-level errors */}
            {errors?.ingredientSections && (
              <div className="text-sm text-destructive">
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
            />
          </div>
        ) : (
          renderFlatIngredients()
        )}
      </CardContent>
    </Card>
  );
}