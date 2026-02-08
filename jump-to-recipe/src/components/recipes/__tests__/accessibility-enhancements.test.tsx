/**
 * Accessibility Enhancements Tests
 * 
 * Tests for Task 14: Add accessibility enhancements
 * 
 * This test suite verifies that all accessibility features are properly implemented:
 * - ARIA labels on drag handles
 * - Screen reader announcements for drag operations
 * - ARIA labels on drop targets
 * - Keyboard accessibility
 * - Proper semantic HTML structure
 * 
 * Requirements validated: All (accessibility)
 */

import { render, screen, within } from '@testing-library/react';
import { RecipeIngredientsWithSections } from '../recipe-ingredients-with-sections';
import { useForm } from 'react-hook-form';

// Mock the drag-and-drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => {
    const provided = {
      innerRef: jest.fn(),
      droppableProps: {},
      placeholder: null,
    };
    const snapshot = { isDraggingOver: false };
    return <div data-testid="droppable">{children(provided, snapshot)}</div>;
  },
  Draggable: ({ children, draggableId }: any) => {
    const provided = {
      innerRef: jest.fn(),
      draggableProps: {},
      dragHandleProps: {},
    };
    const snapshot = { isDragging: false };
    return <div data-testid={`draggable-${draggableId}`}>{children(provided, snapshot)}</div>;
  },
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const { control, watch } = useForm({
    defaultValues: {
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '' },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '' },
      ],
      ingredientSections: [],
    },
  });

  return (
    <RecipeIngredientsWithSections
      control={control}
      watch={watch}
    />
  );
}

describe('Accessibility Enhancements', () => {
  describe('ARIA Labels on Drag Handles', () => {
    it('should have descriptive ARIA labels on drag handles', () => {
      render(<TestWrapper />);
      
      // Drag handles should have aria-label
      const dragHandles = screen.getAllByRole('button', { name: /drag to reorder/i });
      expect(dragHandles.length).toBeGreaterThan(0);
      
      // Each drag handle should describe what it's dragging
      dragHandles.forEach((handle) => {
        expect(handle).toHaveAttribute('aria-label');
        const label = handle.getAttribute('aria-label');
        expect(label).toMatch(/drag to reorder/i);
      });
    });

    it('should link drag handles to drag instructions', () => {
      render(<TestWrapper />);
      
      const dragHandles = screen.getAllByRole('button', { name: /drag to reorder/i });
      
      // Each drag handle should reference the instructions
      dragHandles.forEach((handle) => {
        expect(handle).toHaveAttribute('aria-describedby', 'drag-instructions');
      });
    });

    it('should have keyboard accessible drag handles', () => {
      render(<TestWrapper />);
      
      const dragHandles = screen.getAllByRole('button', { name: /drag to reorder/i });
      
      // Each drag handle should be keyboard accessible
      dragHandles.forEach((handle) => {
        expect(handle).toHaveAttribute('tabIndex', '0');
        expect(handle).toHaveAttribute('role', 'button');
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have a live region for drag announcements', () => {
      render(<TestWrapper />);
      
      // Should have a status region for announcements
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
      expect(statusRegion).toHaveClass('sr-only');
    });
  });

  describe('ARIA Labels on Drop Targets', () => {
    it('should have descriptive ARIA label on flat list drop target', () => {
      render(<TestWrapper />);
      
      // The droppable area should have a descriptive label
      const list = screen.getByRole('list', { name: /ingredient list/i });
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('aria-label');
      expect(list.getAttribute('aria-label')).toMatch(/drag to reorder/i);
    });

    it('should link drop targets to drag instructions', () => {
      render(<TestWrapper />);
      
      const list = screen.getByRole('list', { name: /ingredient list/i });
      expect(list).toHaveAttribute('aria-describedby', 'drag-instructions');
    });
  });

  describe('Drag Instructions', () => {
    it('should provide drag instructions for screen readers', () => {
      render(<TestWrapper />);
      
      // Instructions should exist and be hidden visually
      const instructions = document.getElementById('drag-instructions');
      expect(instructions).toBeInTheDocument();
      expect(instructions).toHaveClass('sr-only');
      expect(instructions?.textContent).toMatch(/to reorder ingredients/i);
    });

    it('should provide different instructions for touch devices', () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        value: true,
        writable: true,
      });

      render(<TestWrapper />);
      
      const instructions = document.getElementById('drag-instructions');
      expect(instructions?.textContent).toMatch(/long press/i);
    });
  });

  describe('List Item Semantics', () => {
    it('should mark ingredients as list items', () => {
      render(<TestWrapper />);
      
      // Each ingredient should be a list item
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should provide descriptive labels for list items', () => {
      render(<TestWrapper />);
      
      const listItems = screen.getAllByRole('listitem');
      
      // Each list item should have a descriptive label
      listItems.forEach((item) => {
        expect(item).toHaveAttribute('aria-label');
        const label = item.getAttribute('aria-label');
        expect(label).toMatch(/ingredient \d+:/i);
      });
    });
  });

  describe('Button Accessibility', () => {
    it('should have descriptive label on toggle sections button', () => {
      render(<TestWrapper />);
      
      const toggleButton = screen.getByRole('button', { name: /organize into sections/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });

  describe('Error Announcements', () => {
    it('should announce errors with role="alert"', () => {
      const { control, watch } = useForm({
        defaultValues: {
          ingredients: [],
          ingredientSections: [],
        },
      });

      const errors = {
        ingredientSections: {
          message: 'Section cannot be empty',
        },
      };

      render(
        <RecipeIngredientsWithSections
          control={control}
          watch={watch}
          errors={errors}
        />
      );

      // Error should be announced
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/section cannot be empty/i);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should maintain logical tab order', () => {
      render(<TestWrapper />);
      
      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button');
      
      // All should be keyboard accessible
      focusableElements.forEach((element) => {
        const tabIndex = element.getAttribute('tabIndex');
        expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true);
      });
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(<TestWrapper />);
      
      const dragHandles = screen.getAllByRole('button', { name: /drag to reorder/i });
      
      // Each drag handle should have focus-visible styles
      dragHandles.forEach((handle) => {
        expect(handle.className).toMatch(/focus-visible:ring/);
      });
    });
  });

  describe('Semantic HTML Structure', () => {
    it('should use semantic list structure', () => {
      render(<TestWrapper />);
      
      // Should have a list element
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      // Should have list items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should use semantic button elements', () => {
      render(<TestWrapper />);
      
      // All interactive elements should be buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('WCAG Compliance', () => {
    it('should have accessible names for all interactive elements', () => {
      render(<TestWrapper />);
      
      const buttons = screen.getAllByRole('button');
      
      // All buttons should have accessible names
      buttons.forEach((button) => {
        const accessibleName = button.getAttribute('aria-label') || button.textContent;
        expect(accessibleName).toBeTruthy();
        expect(accessibleName?.trim().length).toBeGreaterThan(0);
      });
    });

    it('should properly communicate disabled state', () => {
      const { control, watch } = useForm({
        defaultValues: {
          ingredients: [
            { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '' },
          ],
          ingredientSections: [],
        },
      });

      render(
        <RecipeIngredientsWithSections
          control={control}
          watch={watch}
          isLoading={true}
        />
      );

      const dragHandles = screen.getAllByRole('button', { name: /drag to reorder/i });
      
      // Disabled drag handles should communicate their state
      dragHandles.forEach((handle) => {
        expect(handle).toHaveAttribute('aria-disabled', 'true');
        expect(handle).toHaveAttribute('tabIndex', '-1');
      });
    });
  });
});
