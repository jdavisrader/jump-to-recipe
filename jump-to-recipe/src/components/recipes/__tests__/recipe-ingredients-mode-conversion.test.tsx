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

describe('RecipeIngredientsWithSections - Mode Conversion', () => {
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
        { id: '1', name: 'Test', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
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
      
      const sections: IngredientSection[] = [
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
        
        // Verify position property is recalculated for flat mode (Requirement 4.4)
        expect(capturedFormData.ingredients[0].position).toBe(0);
        expect(capturedFormData.ingredients[1].position).toBe(1);
        expect(capturedFormData.ingredients[2].position).toBe(2);
        expect(capturedFormData.ingredients[3].position).toBe(3);
      });
    });

    it('respects section order when flattening', async () => {
      const user = userEvent.setup();
      
      // Sections with non-sequential order values
      const sections: IngredientSection[] = [
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
      
      const sections: IngredientSection[] = [
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
      
      const sections: IngredientSection[] = [
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
        { id: '1', name: 'First', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
        { id: '2', name: 'Second', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
        { id: '3', name: 'Third', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 2 },
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

  describe('Position Management During Mode Conversion', () => {
    it('recalculates positions to global scope when converting sections to flat (Requirement 4.4)', async () => {
      const user = userEvent.setup();
      
      // Multiple sections with section-scoped positions
      const sections: IngredientSection[] = [
        {
          id: 'section-1',
          name: 'Dry Ingredients',
          order: 0,
          items: [
            { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
            { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
          ],
        },
        {
          id: 'section-2',
          name: 'Wet Ingredients',
          order: 1,
          items: [
            { id: '3', name: 'Milk', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 }, // Section-scoped position 0
            { id: '4', name: 'Eggs', amount: 2, unit: '', displayAmount: '2', notes: '', position: 1 }, // Section-scoped position 1
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

      // Convert to flat list
      const toggleButton = screen.getByText('Use Simple List');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        expect(capturedFormData.ingredients.length).toBe(4);
        
        // Verify positions are recalculated to global scope (0, 1, 2, 3)
        expect(capturedFormData.ingredients[0].position).toBe(0);
        expect(capturedFormData.ingredients[1].position).toBe(1);
        expect(capturedFormData.ingredients[2].position).toBe(2);
        expect(capturedFormData.ingredients[3].position).toBe(3);
        
        // Verify order is preserved (section order, then item position)
        expect(capturedFormData.ingredients[0].name).toBe('Flour');
        expect(capturedFormData.ingredients[1].name).toBe('Sugar');
        expect(capturedFormData.ingredients[2].name).toBe('Milk');
        expect(capturedFormData.ingredients[3].name).toBe('Eggs');
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
      const toggleButton = screen.getByText('Organize into Sections');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        expect(capturedFormData.ingredientSections.length).toBe(1);
        
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

    it('maintains position integrity through multiple conversions', async () => {
      const user = userEvent.setup();
      
      const originalIngredients: Ingredient[] = [
        { id: '1', name: 'A', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
        { id: '2', name: 'B', amount: 2, unit: 'tbsp', displayAmount: '2', notes: '', position: 1 },
        { id: '3', name: 'C', amount: 3, unit: 'tsp', displayAmount: '3', notes: '', position: 2 },
      ];

      let capturedFormData: any = null;
      
      render(
        <TestWrapper 
          defaultIngredients={originalIngredients}
          onFormChange={(data) => { capturedFormData = data; }}
        />
      );

      // First conversion: flat -> sections
      const toggleToSections = screen.getByText('Organize into Sections');
      await user.click(toggleToSections);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        const section = capturedFormData.ingredientSections[0];
        
        // Verify section-scoped positions
        expect(section.items[0].position).toBe(0);
        expect(section.items[1].position).toBe(1);
        expect(section.items[2].position).toBe(2);
      });

      // Second conversion: sections -> flat
      const toggleToFlat = screen.getByText('Use Simple List');
      await user.click(toggleToFlat);

      await waitFor(() => {
        expect(capturedFormData?.ingredients).toBeDefined();
        
        // Verify global positions
        expect(capturedFormData.ingredients[0].position).toBe(0);
        expect(capturedFormData.ingredients[1].position).toBe(1);
        expect(capturedFormData.ingredients[2].position).toBe(2);
        
        // Verify order is still correct
        expect(capturedFormData.ingredients[0].name).toBe('A');
        expect(capturedFormData.ingredients[1].name).toBe('B');
        expect(capturedFormData.ingredients[2].name).toBe('C');
      });

      // Third conversion: flat -> sections again
      const toggleToSectionsAgain = screen.getByText('Organize into Sections');
      await user.click(toggleToSectionsAgain);

      await waitFor(() => {
        expect(capturedFormData?.ingredientSections).toBeDefined();
        const section = capturedFormData.ingredientSections[0];
        
        // Verify section-scoped positions are still correct
        expect(section.items[0].position).toBe(0);
        expect(section.items[1].position).toBe(1);
        expect(section.items[2].position).toBe(2);
        
        // Verify order is still correct
        expect(section.items[0].name).toBe('A');
        expect(section.items[1].name).toBe('B');
        expect(section.items[2].name).toBe('C');
      });
    });
  });
});
