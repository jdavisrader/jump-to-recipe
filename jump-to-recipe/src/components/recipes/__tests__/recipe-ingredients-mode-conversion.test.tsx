/**
 * Tests for mode conversion between flat and sectioned ingredient lists
 * 
 * Requirements tested:
 * - 3.4: Flat-to-sectioned conversion preserves ingredient order
 * - 3.5: Sectioned-to-flat conversion preserves ingredient order
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';

import { RecipeIngredientsWithSections } from '../recipe-ingredients-with-sections';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';

// Note: Ingredient now includes required position property as of explicit-position-persistence spec

// Mock the SectionManager component to avoid complex rendering
jest.mock('../../sections/section-manager', () => ({
  SectionManager: ({ sections, onSectionsChange }: any) => (
    <div data-testid="section-manager">
      <div data-testid="sections-count">{sections.length}</div>
      {sections.map((section: any, idx: number) => (
        <div key={section.id} data-testid={`section-${idx}`}>
          <div data-testid={`section-${idx}-name`}>{section.name}</div>
          <div data-testid={`section-${idx}-items-count`}>{section.items.length}</div>
          {section.items.map((item: any, itemIdx: number) => (
            <div key={item.id} data-testid={`section-${idx}-item-${itemIdx}`}>
              {item.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

// Mock drag-and-drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }: any) => children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

// Test wrapper component
function TestWrapper({ 
  defaultIngredients = [],
  defaultSections = [],
  onFormChange
}: { 
  defaultIngredients?: Ingredient[];
  defaultSections?: IngredientSection[];
  onFormChange?: (data: any) => void;
}) {
  const form = useForm({
    defaultValues: {
      ingredients: defaultIngredients,
      ingredientSections: defaultSections,
    },
  });

  // Watch for form changes
  const formValues = form.watch();
  if (onFormChange) {
    onFormChange(formValues);
  }

  return (
    <FormProvider {...form}>
      <RecipeIngredientsWithSections
        control={form.control}
        watch={form.watch}
        errors={form.formState.errors}
        setError={form.setError}
        clearErrors={form.clearErrors}
      />
    </FormProvider>
  );
}

describe('RecipeIngredientsWithSections - Add section', () => {
  describe('Flat to Sectioned Conversion', () => {
    it('preserves ingredient order when converting from flat to sectioned', async () => {
      const user = userEvent.setup();
      
      const flatIngredients: Ingredient[] = [
        { id: '1', name: 'First Ingredient', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
        { id: '2', name: 'Second Ingredient', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
        { id: '3', name: 'Third Ingredient', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 2 },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={flatIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // Adding a section turns the flat list into the first section
      const toggleButton = screen.getByRole('button', { name: 'Add section' });
      await user.click(toggleButton);

      // Wait for the conversion to complete
      await waitFor(() => {
        expect(screen.getByTestId('section-manager')).toBeInTheDocument();
      });

      // Verify that a section was created
      expect(screen.getByTestId('sections-count')).toHaveTextContent('2');

      // Verify the section contains all ingredients in the correct order
      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(2);
        
        const section = capturedFormData.ingredientSections[0];
        expect(section.items.length).toBe(3);
        
        // Verify order is preserved
        expect(section.items[0].name).toBe('First Ingredient');
        expect(section.items[1].name).toBe('Second Ingredient');
        expect(section.items[2].name).toBe('Third Ingredient');
        
        // Verify positions are assigned correctly
        expect(section.items[0].position).toBe(0);
        expect(section.items[1].position).toBe(1);
        expect(section.items[2].position).toBe(2);
      });
    });

    it('names the existing group "Ingredients" and adds an empty section after it', async () => {
      const user = userEvent.setup();
      
      const flatIngredients: Ingredient[] = [
        { id: '1', name: 'Test', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={flatIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByRole('button', { name: 'Add section' });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections[0].name).toBe('Ingredients');
        expect(capturedFormData.ingredientSections[1]).toMatchObject({ name: 'Untitled Section', items: [] });
      });
    });

    it('handles empty ingredient list when converting to sections', async () => {
      const user = userEvent.setup();
      
      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={[]}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByRole('button', { name: 'Add section' });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(2);
        expect(capturedFormData.ingredientSections[0].items.length).toBe(0);
      });
    });

    it('assigns section-scoped positions when converting flat to sections (Requirement 4.5)', async () => {
      const user = userEvent.setup();
      
      // Flat list with global positions
      const flatIngredients: Ingredient[] = [
        { id: '1', name: 'First', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
        { id: '2', name: 'Second', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
        { id: '3', name: 'Third', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 2 },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={flatIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // Convert to sections
      const toggleButton = screen.getByRole('button', { name: 'Add section' });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(2);
        
        const section = capturedFormData.ingredientSections[0];
        expect(section.items.length).toBe(3);
        
        // Verify positions are assigned based on array order (section-scoped)
        expect(section.items[0].position).toBe(0);
        expect(section.items[1].position).toBe(1);
        expect(section.items[2].position).toBe(2);
        
        // Verify order is preserved
        expect(section.items[0].name).toBe('First');
        expect(section.items[1].name).toBe('Second');
        expect(section.items[2].name).toBe('Third');
      });
    });
  });
});
