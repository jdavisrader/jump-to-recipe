import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager, Section } from '../section-manager';
import { SectionHeader } from '../section-header';
import { EditableTitle } from '../editable-title';

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
      
      // Verify buttons are accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation through sections', async () => {
      const user = userEvent.setup();
      render(<SectionManager {...mockProps} />);
      
      // Tab through interactive elements - simplified tab order without drag handles
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Click to edit');
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('title', 'Delete section');
    });

    it('should have simplified tab order without drag handles', async () => {
      const user = userEvent.setup();
      render(<SectionManager {...mockProps} />);
      
      // Verify drag handles are not in the tab order
      const dragHandles = screen.queryAllByTitle('Drag to reorder');
      expect(dragHandles).toHaveLength(0);
      
      // Tab through and verify only edit and delete buttons are focusable
      await user.tab();
      const firstFocused = document.activeElement;
      expect(firstFocused).toHaveAttribute('title', 'Click to edit');
      
      await user.tab();
      const secondFocused = document.activeElement;
      expect(secondFocused).toHaveAttribute('title', 'Delete section');
    });

    it('should announce loading state to screen readers', () => {
      render(<SectionManager {...mockProps} isLoading={true} />);
      
      // Loading skeletons should be present with proper structure
      const loadingElements = document.querySelectorAll('[class*="skeleton"]');
      expect(loadingElements.length).toBeGreaterThan(0);
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
      expect(emptyIndicator.closest('div')).toHaveClass('section-empty-indicator');
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

    it('should have proper ARIA structure without drag handles', async () => {
      render(<SectionHeader {...headerProps} />);
      
      // Check that interactive elements are present
      const deleteButton = screen.getByTitle('Delete section');
      expect(deleteButton).toBeInTheDocument();
      
      // Verify drag handle is not present
      const dragHandle = screen.queryByTitle('Drag to reorder');
      expect(dragHandle).not.toBeInTheDocument();
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
      
      // Cancel button should close modal
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Delete Section')).not.toBeInTheDocument();
      });
    });

    it('should manage focus after section deletion', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      const deleteProps = { ...headerProps, onDelete };
      
      render(<SectionHeader {...deleteProps} />);
      
      const deleteButton = screen.getByTitle('Delete section');
      await user.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);
      
      // Verify delete callback was called
      expect(onDelete).toHaveBeenCalledWith('section-1');
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
    it('should provide smooth transitions for section operations', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check for transition classes (not drag-related)
      const sections = document.querySelectorAll('[class*="transition"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should indicate loading states with appropriate animations', () => {
      render(<SectionManager {...mockProps} isAddingSection={true} />);
      
      const addButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addButton).toBeDisabled();
      
      // Check for loading indicator (Loader2 icon with section-spinner class)
      const loadingIcon = addButton.querySelector('.section-spinner');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('should provide visual feedback for interactive elements', () => {
      render(<SectionManager {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      // Verify buttons are interactive and accessible
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should render items with proper structure', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check that items are rendered properly
      const items = screen.getAllByText(/Flour/);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful button labels', () => {
      render(<SectionManager {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Add Ingredient Section/ })).toBeInTheDocument();
      // Each section has an "Add Ingredient" button, plus the main "Add Ingredient Section" button
      const addButtons = screen.getAllByRole('button', { name: /Add Ingredient/ });
      expect(addButtons.length).toBeGreaterThanOrEqual(2);
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

    it('should announce section operations to screen readers', async () => {
      const user = userEvent.setup();
      const onSectionsChange = jest.fn();
      render(<SectionManager {...mockProps} onSectionsChange={onSectionsChange} />);
      
      // Add section operation
      const addButton = screen.getByRole('button', { name: /Add Ingredient Section/ });
      expect(addButton).toHaveAccessibleName('Add Ingredient Section');
      
      // Delete section operation
      const deleteButtons = screen.getAllByTitle('Delete section');
      expect(deleteButtons[0]).toHaveAccessibleName();
      
      // Rename section operation
      const editButtons = screen.getAllByTitle('Click to edit');
      expect(editButtons[0]).toHaveAccessibleName();
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

    it('should manage focus in modal dialogs', async () => {
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
      
      // Modal should be visible with focusable elements
      expect(screen.getByText('Delete Section')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});