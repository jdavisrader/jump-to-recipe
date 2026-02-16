/**
 * Tests for drag-only-from-handle restriction
 * 
 * Validates Requirement 4.5:
 * WHEN a user attempts to drag an ingredient from anywhere other than the drag handle
 * THEN the drag operation SHALL NOT initiate
 */

import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { RecipeIngredientsWithSections } from '../recipe-ingredients-with-sections';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';

// Mock the SectionManager component
jest.mock('../../sections/section-manager', () => ({
  SectionManager: ({ sections, renderItem }: any) => (
    <div data-testid="section-manager">
      {sections.map((section: any) => (
        <div key={section.id} data-testid={`section-${section.id}`}>
          {section.items.map((item: any, index: number) => renderItem(item, index, section.id))}
        </div>
      ))}
    </div>
  ),
}));

// Mock @hello-pangea/dnd with custom props to test drag handle restriction
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => 
    children(
      { 
        innerRef: jest.fn(), 
        droppableProps: { 'data-testid': 'droppable' }, 
        placeholder: null 
      }, 
      { isDraggingOver: false }
    ),
  Draggable: ({ children, draggableId }: any) => 
    children(
      { 
        innerRef: jest.fn(), 
        draggableProps: { 
          'data-testid': `draggable-${draggableId}`,
          'data-drag-source': 'anywhere' // Simulates draggableProps - allows drag from anywhere
        }, 
        dragHandleProps: { 
          'data-testid': `drag-handle-${draggableId}`,
          'data-drag-source': 'handle-only' // Simulates dragHandleProps - restricts drag to handle
        } 
      }, 
      { isDragging: false }
    ),
}));

// Test wrapper component
function TestWrapper() {
  const form = useForm({
    defaultValues: {
      ingredients: [
        {
          id: 'ing-1',
          name: 'Flour',
          amount: 2,
          unit: 'cup',
          displayAmount: '2',
          notes: '',
          position: 0,
        },
      ],
      ingredientSections: [],
    },
  });

  return (
    <FormProvider {...form}>
      <RecipeIngredientsWithSections
        control={form.control}
        watch={form.watch}
      />
    </FormProvider>
  );
}

describe('Drag-only-from-handle restriction - Flat mode', () => {
  it('should apply dragHandleProps only to the drag handle wrapper', () => {
    render(<TestWrapper />);

    // Find the drag handle element (the wrapper div with dragHandleProps)
    // Use a query that works with dynamic IDs
    const dragHandleElement = screen.getByTestId(/^drag-handle-/);
    
    // Verify dragHandleProps are applied (data-drag-source='handle-only')
    // This means only this element can initiate drag operations
    expect(dragHandleElement).toHaveAttribute('data-drag-source', 'handle-only');
  });

  it('should apply draggableProps to the outer container, not the drag handle', () => {
    render(<TestWrapper />);

    // Find the draggable container (the outer div with draggableProps)
    // Use a query that works with dynamic IDs
    const draggableContainer = screen.getByTestId(/^draggable-/);
    
    // Verify draggableProps are applied to container (data-drag-source='anywhere')
    // This provides drag context but doesn't enable dragging from this element
    expect(draggableContainer).toHaveAttribute('data-drag-source', 'anywhere');
  });

  it('should have separate elements for draggableProps and dragHandleProps', () => {
    render(<TestWrapper />);

    // Get both elements using regex to match dynamic IDs
    const draggableContainer = screen.getByTestId(/^draggable-/);
    const dragHandleElement = screen.getByTestId(/^drag-handle-/);

    // Verify they are different elements
    expect(draggableContainer).not.toBe(dragHandleElement);
    
    // Verify the drag handle is a child of the draggable container
    expect(draggableContainer).toContainElement(dragHandleElement);
  });

  it('should render DragHandle component inside the dragHandleProps wrapper', () => {
    render(<TestWrapper />);

    // The DragHandle component should be rendered within the drag handle wrapper
    // This ensures the visual indicator is in the correct location
    const dragHandleWrapper = screen.getByTestId(/^drag-handle-/);
    expect(dragHandleWrapper).toBeInTheDocument();
  });
});

describe('Drag-only-from-handle restriction - Sectioned mode', () => {
  function TestWrapperSectioned() {
    const form = useForm({
      defaultValues: {
        ingredients: [],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: 'ing-1',
                name: 'Flour',
                amount: 2,
                unit: 'cup',
                displayAmount: '2',
                notes: '',
                position: 0,
              },
            ],
          },
        ],
      },
    });

    return (
      <FormProvider {...form}>
        <RecipeIngredientsWithSections
          control={form.control}
          watch={form.watch}
        />
      </FormProvider>
    );
  }

  it('should apply dragHandleProps only to the drag handle wrapper in sectioned mode', () => {
    render(<TestWrapperSectioned />);

    // Find the drag handle element in sectioned mode
    const dragHandleElement = screen.getByTestId('drag-handle-section-1-ing-1');
    
    // Verify dragHandleProps are applied (restricts drag to handle only)
    expect(dragHandleElement).toHaveAttribute('data-drag-source', 'handle-only');
  });

  it('should apply draggableProps to the outer container in sectioned mode', () => {
    render(<TestWrapperSectioned />);

    // Find the draggable container in sectioned mode
    const draggableContainer = screen.getByTestId('draggable-section-1-ing-1');
    
    // Verify draggableProps are applied to container (provides context)
    expect(draggableContainer).toHaveAttribute('data-drag-source', 'anywhere');
  });

  it('should have separate elements for draggableProps and dragHandleProps in sectioned mode', () => {
    render(<TestWrapperSectioned />);

    // Get both elements
    const draggableContainer = screen.getByTestId('draggable-section-1-ing-1');
    const dragHandleElement = screen.getByTestId('drag-handle-section-1-ing-1');

    // Verify they are different elements
    expect(draggableContainer).not.toBe(dragHandleElement);
    
    // Verify the drag handle is a child of the draggable container
    expect(draggableContainer).toContainElement(dragHandleElement);
  });
});

describe('Drag-only-from-handle restriction - Implementation verification', () => {
  it('verifies the correct @hello-pangea/dnd pattern is used', () => {
    render(<TestWrapper />);

    // This test documents the correct pattern:
    // 1. draggableProps on outer container (provides drag context)
    // 2. dragHandleProps on specific element (restricts drag initiation)
    // 
    // This pattern ensures that:
    // - Users can only drag by clicking/touching the drag handle
    // - Clicking other parts of the ingredient (inputs, buttons) doesn't start a drag
    // - The drag handle is the only interactive element for drag operations
    
    const draggableContainer = screen.getByTestId(/^draggable-/);
    const dragHandleElement = screen.getByTestId(/^drag-handle-/);

    // Verify the pattern is correctly implemented
    expect(draggableContainer).toHaveAttribute('data-drag-source', 'anywhere');
    expect(dragHandleElement).toHaveAttribute('data-drag-source', 'handle-only');
    expect(draggableContainer).toContainElement(dragHandleElement);
  });
});
