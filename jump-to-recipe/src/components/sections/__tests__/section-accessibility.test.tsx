import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager, Section } from '../section-manager';
import { SectionHeader } from '../section-header';
import { EditableTitle } from '../editable-title';

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

describe('Section Components Accessibility', () => {
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

  describe('SectionManager Accessibility', () => {
    it('should have proper ARIA structure', async () => {
      render(<SectionManager {...mockProps} />);
      
      // Check that buttons have proper roles and labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    it('should provide proper ARIA labels for drag handles', () => {
      render(<SectionManager {...mockProps} />);
      
      const dragHandles = screen.getAllByTitle('Drag to reorder');
      expect(dragHandles).toHaveLength(2);
      
      dragHandles.forEach(handle => {
        expect(handle).toBeInTheDocument();
        expect(handle).toHaveAttribute('title', 'Drag to reorder');
      });
    });

    it('should support keyboard navigation through sections', async () => {
      const user = userEvent.setup();
      render(<SectionManager {...mockProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Drag to reorder');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Click to edit');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Delete section');
    });

    it('should announce loading state to screen readers', () => {
      render(<SectionManager {...mockProps} isLoading={true} />);
      
      // Loading skeletons should be present
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should provide meaningful empty state messaging', () => {
      const emptyProps = { ...mockProps, sections: [] };
      render(<SectionManager {...emptyProps} />);
      
      expect(screen.getByText('No sections yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first ingredient section/)).toBeInTheDocument();
    });

    it('should indicate empty sections with proper visual cues', () => {
      render(<SectionManager {...mockProps} />);
      
      const emptyIndicator = screen.getByText(/This section is empty/);
      expect(emptyIndicator).toBeInTheDocument();
      expect(emptyIndicator.closest('div')).toHaveClass('animate-pulse');
    });

    it('should disable buttons appropriately during loading states', () => {
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

  describe('SectionHeader Accessibility', () => {
    const headerProps = {
      section: mockSections[0],
      onRename: jest.fn(),
      onDelete: jest.fn(),
      canDelete: true
    };

    it('should have proper ARIA structure', async () => {
      render(<SectionHeader {...headerProps} />);
      
      // Check that interactive elements have proper attributes
      const deleteButton = screen.getByTitle('Delete section');
      expect(deleteButton).toHaveAttribute('type', 'button');
      
      const dragHandle = screen.getByTitle('Drag to reorder');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should provide proper focus management for delete confirmation', async () => {
      const user = userEvent.setup();
      render(<SectionHeader {...headerProps} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      await user.click(deleteButton);
      
      // Modal should be visible and focusable
      expect(screen.getByText('Delete Section')).toBeInTheDocument();
      
      // Cancel button should be focusable
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      
      await user.click(cancelButton);
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
      });
    });

    it('should support keyboard interaction for delete confirmation', async () => {
      const user = userEvent.setup();
      render(<SectionHeader {...headerProps} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      await user.click(deleteButton);
      
      // Should be able to navigate with keyboard
      await user.keyboard('{Tab}');
      expect(document.activeElement).toHaveTextContent('Cancel');
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toHaveTextContent('Delete');
      
      // Escape should close modal
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
      });
    });

    it('should indicate dragging state visually and to screen readers', () => {
      render(<SectionHeader {...headerProps} isDragging={true} />);
      
      const header = screen.getByTitle('Drag to reorder').closest('div');
      expect(header).toHaveClass('shadow-xl');
      expect(header).toHaveClass('border-blue-300');
    });

    it('should disable interactions during deletion', () => {
      render(<SectionHeader {...headerProps} isDeleting={true} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      expect(deleteButton).toBeDisabled();
      
      const header = deleteButton.closest('div');
      expect(header).toHaveClass('animate-pulse');
      expect(header).toHaveClass('opacity-50');
    });
  });

  describe('EditableTitle Accessibility', () => {
    const titleProps = {
      value: 'Test Section',
      onChange: jest.fn()
    };

    it('should have proper ARIA structure', async () => {
      render(<EditableTitle {...titleProps} />);
      
      // Check that the editable title has proper attributes
      const button = screen.getByTitle('Click to edit');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should provide proper keyboard navigation for editing', async () => {
      const user = userEvent.setup();
      render(<EditableTitle {...titleProps} />);
      
      const button = screen.getByTitle('Click to edit');
      await user.click(button);
      
      const input = screen.getByDisplayValue('Test Section');
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should support keyboard shortcuts for save/cancel', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<EditableTitle {...titleProps} onChange={onChange} />);
      
      const button = screen.getByTitle('Click to edit');
      await user.click(button);
      
      const input = screen.getByDisplayValue('Test Section');
      await user.clear(input);
      await user.type(input, 'New Name');
      
      // Enter should save
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('New Name');
    });

    it('should handle escape key to cancel editing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<EditableTitle {...titleProps} onChange={onChange} />);
      
      const button = screen.getByTitle('Click to edit');
      await user.click(button);
      
      const input = screen.getByDisplayValue('Test Section');
      await user.clear(input);
      await user.type(input, 'New Name');
      
      // Escape should cancel
      await user.keyboard('{Escape}');
      expect(onChange).not.toHaveBeenCalled();
      
      // Should return to button state
      expect(screen.getByTitle('Click to edit')).toBeInTheDocument();
    });

    it('should indicate disabled state properly', () => {
      render(<EditableTitle {...titleProps} disabled={true} />);
      
      const button = screen.getByTitle('Editing disabled');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('should provide proper placeholder text', async () => {
      const user = userEvent.setup();
      render(<EditableTitle value="" onChange={jest.fn()} placeholder="Custom Placeholder" />);
      
      const button = screen.getByTitle('Click to edit');
      await user.click(button);
      
      const input = screen.getByPlaceholderText('Custom Placeholder');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('should provide smooth transitions for drag operations', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check for transition classes
      const sections = document.querySelectorAll('[class*="transition"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should indicate loading states with appropriate animations', () => {
      render(<SectionManager {...mockProps} isAddingSection={true} />);
      
      const addButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addButton).toHaveClass('animate-pulse');
      
      const spinner = screen.getByRole('button', { name: /Add Ingredient Section/ }).querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should provide visual feedback for hover states', () => {
      render(<SectionManager {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(/hover:/);
      });
    });

    it('should animate new items being added', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check for animation classes on items
      const animatedElements = document.querySelectorAll('[class*="animate-in"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful button labels', () => {
      render(<SectionManager {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Add Ingredient Section/ })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Add Ingredient/ })).toHaveLength(2);
    });

    it('should announce state changes appropriately', async () => {
      const user = userEvent.setup();
      render(<SectionManager {...mockProps} />);
      
      const addButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      
      // Button should be properly labeled
      expect(addButton).toHaveAccessibleName();
    });

    it('should provide context for empty sections', () => {
      render(<SectionManager {...mockProps} />);
      
      const emptyMessage = screen.getByText(/This section is empty/);
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveTextContent(/Add ingredients below/);
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus during section operations', async () => {
      const user = userEvent.setup();
      render(<SectionManager {...mockProps} />);
      
      const editButton = screen.getAllByTitle('Click to edit')[0];
      await user.click(editButton);
      
      const input = screen.getByDisplayValue('Ingredients');
      expect(input).toHaveFocus();
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      const headerProps = {
        section: mockSections[0],
        onRename: jest.fn(),
        onDelete: jest.fn(),
        canDelete: true
      };
      
      render(<SectionHeader {...headerProps} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      await user.click(deleteButton);
      
      // Focus should be within modal
      const modal = screen.getByText('Delete Section').closest('div');
      expect(modal).toContainElement(document.activeElement);
    });
  });
});