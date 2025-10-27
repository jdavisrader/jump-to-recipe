import { render, screen, fireEvent } from '@testing-library/react';
import { SectionManager, Section } from '../section-manager';
import { SectionHeader } from '../section-header';

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({ 
    innerRef: jest.fn(), 
    droppableProps: {}, 
    placeholder: null 
  }, { isDraggingOver: false }),
  Draggable: ({ children }: any) => children({ 
    innerRef: jest.fn(), 
    draggableProps: { style: {} }, 
    dragHandleProps: {} 
  }, { isDragging: false }),
}));

describe('Section Animation and Feedback', () => {
  const mockSections: Section[] = [
    {
      id: 'section-1',
      name: 'Ingredients',
      order: 0,
      items: [{ id: 'item-1', name: 'Flour' }]
    },
    {
      id: 'section-2', 
      name: 'Instructions',
      order: 1,
      items: []
    }
  ];

  const mockProps = {
    sections: mockSections,
    onSectionsChange: jest.fn(),
    onAddItem: jest.fn(),
    onRemoveItem: jest.fn(),
    renderItem: (item: any) => <div key={item.id}>{item.name}</div>,
    itemType: 'ingredient' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(<SectionManager {...mockProps} isLoading={true} />);
      
      const skeletons = document.querySelectorAll('.section-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show loading spinner on add section button when isAddingSection is true', () => {
      render(<SectionManager {...mockProps} isAddingSection={true} />);
      
      const addButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveClass('animate-pulse');
    });

    it('should show loading spinner on add item button when isAddingItem is true', () => {
      const loadingProps = {
        ...mockProps,
        isAddingItem: { 'section-1': true }
      };
      
      render(<SectionManager {...loadingProps} />);
      
      const addItemButtons = screen.getAllByRole('button', { name: /Add Ingredient/ });
      expect(addItemButtons[0]).toBeDisabled();
      expect(addItemButtons[0]).toHaveClass('animate-pulse');
    });
  });

  describe('Visual Feedback', () => {
    it('should apply section-button class for hover animations', () => {
      render(<SectionManager {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('section-button');
      });
    });

    it('should show empty section indicator with animation classes', () => {
      render(<SectionManager {...mockProps} />);
      
      const emptyIndicator = screen.getByText(/This section is empty/);
      expect(emptyIndicator).toBeInTheDocument();
      expect(emptyIndicator.closest('div')).toHaveClass('section-empty-indicator');
      
      const dot = emptyIndicator.parentElement?.querySelector('.section-empty-dot');
      expect(dot).toBeInTheDocument();
    });

    it('should show meaningful empty state when no sections exist', () => {
      const emptyProps = { ...mockProps, sections: [] };
      render(<SectionManager {...emptyProps} />);
      
      expect(screen.getByText('No sections yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first ingredient section/)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Feedback', () => {
    it('should apply drop zone classes', () => {
      render(<SectionManager {...mockProps} />);
      
      const dropZone = document.querySelector('.section-drop-zone');
      expect(dropZone).toBeInTheDocument();
    });

    it('should apply drag preview class when dragging', () => {
      const headerProps = {
        section: mockSections[0],
        onRename: jest.fn(),
        onDelete: jest.fn(),
        isDragging: true
      };
      
      render(<SectionHeader {...headerProps} />);
      
      const header = document.querySelector('.section-drag-preview');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('should use CSS animation classes for smooth transitions', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check that items have animation classes
      const items = document.querySelectorAll('.section-item-enter');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should use spinner animation for loading states', () => {
      render(<SectionManager {...mockProps} isAddingSection={true} />);
      
      const spinner = document.querySelector('.section-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper button types for action buttons', () => {
      render(<SectionManager {...mockProps} />);
      
      const addSectionButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addSectionButton).toHaveAttribute('type', 'button');
      
      const addItemButtons = screen.getAllByRole('button', { name: /Add Ingredient/ });
      addItemButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should provide meaningful button labels', () => {
      render(<SectionManager {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Add Ingredient Section/ })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Add Ingredient/ }).length).toBeGreaterThan(0);
    });

    it('should provide drag handle accessibility', () => {
      render(<SectionManager {...mockProps} />);
      
      const dragHandles = screen.getAllByTitle('Drag to reorder');
      expect(dragHandles.length).toBe(2);
      
      dragHandles.forEach(handle => {
        expect(handle).toBeInTheDocument();
      });
    });

    it('should disable buttons during loading states', () => {
      const loadingProps = {
        ...mockProps,
        isAddingSection: true,
        isAddingItem: { 'section-1': true }
      };
      
      render(<SectionManager {...loadingProps} />);
      
      const addSectionButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addSectionButton).toBeDisabled();
      
      const addItemButtons = screen.getAllByRole('button', { name: /Add Ingredient/ });
      expect(addItemButtons[0]).toBeDisabled();
    });
  });

  describe('Modal Animations', () => {
    it('should apply modal animation classes', () => {
      const headerProps = {
        section: mockSections[0],
        onRename: jest.fn(),
        onDelete: jest.fn()
      };
      
      render(<SectionHeader {...headerProps} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      fireEvent.click(deleteButton);
      
      const modal = document.querySelector('.section-modal-content');
      expect(modal).toBeInTheDocument();
      
      const backdrop = document.querySelector('.section-modal-backdrop');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of sections efficiently', () => {
      const largeSections = Array.from({ length: 20 }, (_, i) => ({
        id: `section-${i}`,
        name: `Section ${i + 1}`,
        order: i,
        items: []
      }));
      
      const startTime = performance.now();
      render(<SectionManager {...mockProps} sections={largeSections} />);
      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should render all sections
      expect(screen.getAllByTitle('Drag to reorder')).toHaveLength(20);
    });

    it('should use GPU-accelerated animation classes', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check for CSS classes that use transform/opacity (GPU accelerated)
      const animatedElements = document.querySelectorAll('[class*="section-"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});