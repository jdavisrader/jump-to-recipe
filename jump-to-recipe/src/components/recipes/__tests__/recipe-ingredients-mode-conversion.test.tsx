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

// Extended ingredient type with position for testing
interface IngredientWithPosition extends Ingredient {
  position?: number;
}

// Extended section type for testing
interface TestIngredientSection extends Omit<IngredientSection, 'items'> {
  items: IngredientWithPosition[];
}

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
  defaultSections?: TestIngredientSection[];
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

describe('RecipeIngredientsWithSections - Mode Conversion', () => {
  describe('Flat to Sectioned Conversion', () => {
    it('preserves ingredient order when converting from flat to sectioned', async () => {
      const user = userEvent.setup();
      
      const flatIngredients: Ingredient[] = [
        { id: '1', name: 'First Ingredient', amount: 1, unit: 'cup', displayAmount: '1', notes: '' },
        { id: '2', name: 'Second Ingredient', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '' },
        { id: '3', name: 'Third Ingredient', amount: 3, unit: 'tsp', displayAmount: '3', notes: '' },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={flatIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // Click the toggle button to convert to sections
      const toggleButton = screen.getByText('Organize into Sections');
      await user.click(toggleButton);

      // Wait for the conversion to complete
      await waitFor(() => {
        expect(screen.getByTestId('section-manager')).toBeInTheDocument();
      });

      // Verify that a section was created
      expect(screen.getByTestId('sections-count')).toHaveTextContent('1');

      // Verify the section contains all ingredients in the correct order
      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(1);
        
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

    it('creates a default section named "Ingredients"', async () => {
      const user = userEvent.setup();
      
      const flatIngredients: Ingredient[] = [
        { id: '1', name: 'Test', amount: 1, unit: 'cup', displayAmount: '1', notes: '' },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={flatIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByText('Organize into Sections');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections[0].name).toBe('Ingredients');
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

      const toggleButton = screen.getByText('Organize into Sections');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(1);
        expect(capturedFormData.ingredientSections[0].items.length).toBe(0);
      });
    });
  });

  describe('Sectioned to Flat Conversion', () => {
    it('preserves ingredient order when converting from sectioned to flat', async () => {
      const user = userEvent.setup();
      
      const sections: TestIngredientSection[] = [
        {
          id: 'section-1',
          name: 'First Section',
          order: 0,
          items: [
            { id: '1', name: 'Ingredient A', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
            { id: '2', name: 'Ingredient B', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
          ],
        },
        {
          id: 'section-2',
          name: 'Second Section',
          order: 1,
          items: [
            { id: '3', name: 'Ingredient C', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 0 },
            { id: '4', name: 'Ingredient D', amount: 4, unit: 'oz', displayAmount: '4', notes: '', position: 1 },
          ],
        },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultSections={sections}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // Click the toggle button to convert to flat list
      const toggleButton = screen.getByText('Use Simple List');
      await user.click(toggleButton);

      // Wait for the conversion to complete
      await waitFor(() => {
        expect(screen.queryByTestId('section-manager')).not.toBeInTheDocument();
      });

      // Verify ingredients are in the correct order (section order, then item position)
      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        expect(capturedFormData.ingredients.length).toBe(4);
        
        // Verify order follows section order first, then position within section
        expect(capturedFormData.ingredients[0].name).toBe('Ingredient A');
        expect(capturedFormData.ingredients[1].name).toBe('Ingredient B');
        expect(capturedFormData.ingredients[2].name).toBe('Ingredient C');
        expect(capturedFormData.ingredients[3].name).toBe('Ingredient D');
        
        // Verify position property is removed in flat mode
        expect(capturedFormData.ingredients[0].position).toBeUndefined();
      });
    });

    it('respects section order when flattening', async () => {
      const user = userEvent.setup();
      
      // Sections with non-sequential order values
      const sections: TestIngredientSection[] = [
        {
          id: 'section-2',
          name: 'Second Section',
          order: 5,
          items: [
            { id: '3', name: 'Should be Third', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 0 },
          ],
        },
        {
          id: 'section-1',
          name: 'First Section',
          order: 1,
          items: [
            { id: '1', name: 'Should be First', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
            { id: '2', name: 'Should be Second', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
          ],
        },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultSections={sections}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByText('Use Simple List');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        expect(capturedFormData.ingredients.length).toBe(3);
        
        // Verify order respects section.order property
        expect(capturedFormData.ingredients[0].name).toBe('Should be First');
        expect(capturedFormData.ingredients[1].name).toBe('Should be Second');
        expect(capturedFormData.ingredients[2].name).toBe('Should be Third');
      });
    });

    it('respects item position within sections when flattening', async () => {
      const user = userEvent.setup();
      
      const sections: TestIngredientSection[] = [
        {
          id: 'section-1',
          name: 'Test Section',
          order: 0,
          items: [
            { id: '2', name: 'Second Item', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 5 },
            { id: '1', name: 'First Item', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
            { id: '3', name: 'Third Item', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 10 },
          ],
        },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultSections={sections}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByText('Use Simple List');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        
        // Verify order respects item.position property
        expect(capturedFormData.ingredients[0].name).toBe('First Item');
        expect(capturedFormData.ingredients[1].name).toBe('Second Item');
        expect(capturedFormData.ingredients[2].name).toBe('Third Item');
      });
    });

    it('handles empty sections when converting to flat', async () => {
      const user = userEvent.setup();
      
      const sections: TestIngredientSection[] = [
        {
          id: 'section-1',
          name: 'Empty Section',
          order: 0,
          items: [],
        },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultSections={sections}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      const toggleButton = screen.getByText('Use Simple List');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        // Should create at least one empty ingredient
        expect(capturedFormData.ingredients.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Round-trip Conversion', () => {
    it('preserves ingredient order through flat -> sectioned -> flat conversion', async () => {
      const user = userEvent.setup();
      
      const originalIngredients: Ingredient[] = [
        { id: '1', name: 'First', amount: 1, unit: 'cup', displayAmount: '1', notes: '' },
        { id: '2', name: 'Second', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '' },
        { id: '3', name: 'Third', amount: 3, unit: 'tsp', displayAmount: '3', notes: '' },
      ];

      let capturedFormData: any = null;
      
      const { rerender } = render(
        <TestWrapper 
          defaultIngredients={originalIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // Convert to sections
      const toggleToSections = screen.getByText('Organize into Sections');
      await user.click(toggleToSections);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
      });

      // Convert back to flat
      const toggleToFlat = screen.getByText('Use Simple List');
      await user.click(toggleToFlat);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        expect(capturedFormData.ingredients.length).toBe(3);
        
        // Verify order is preserved
        expect(capturedFormData.ingredients[0].name).toBe('First');
        expect(capturedFormData.ingredients[1].name).toBe('Second');
        expect(capturedFormData.ingredients[2].name).toBe('Third');
      });
    });
  });
});
