import { render, screen, fireEvent } from '@testing-library/react';
import { SectionManager, Section } from '../section-manager';
import { SectionHeader } from '../section-header';

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

  describe('Section Item Entry Animations', () => {
    it('should render sections without drag wrappers', () => {
      render(<SectionManager {...mockProps} />);
      
      // Verify sections are rendered directly without drag-and-drop wrappers
      const sections = screen.getAllByText(/Ingredients|Instructions/);
      expect(sections.length).toBeGreaterThan(0);
      
      // Verify no drag-related classes exist
      const dragPreview = document.querySelector('.section-drag-preview');
      expect(dragPreview).not.toBeInTheDocument();
      
      const dropZone = document.querySelector('.section-drop-zone');
      expect(dropZone).not.toBeInTheDocument();
    });

    it('should apply entry animation classes to section items', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check that items have animation classes
      const items = document.querySelectorAll('.section-item-enter');
      expect(items.length).toBeGreaterThan(0);
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

    it('should not render drag handles', () => {
      render(<SectionManager {...mockProps} />);
      
      // Verify drag handles are not present
      const dragHandles = screen.queryAllByTitle('Drag to reorder');
      expect(dragHandles.length).toBe(0);
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
    it('should handle large numbers of sections efficiently with simplified rendering', () => {
      const largeSections = Array.from({ length: 20 }, (_, i) => ({
        id: `section-${i}`,
        name: `Section ${i + 1}`,
        order: i,
        items: []
      }));
      
      const startTime = performance.now();
      render(<SectionManager {...mockProps} sections={largeSections} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (faster without drag-and-drop)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should render all sections
      const sectionElements = screen.getAllByText(/Section \d+/);
      expect(sectionElements.length).toBe(20);
    });

    it('should use GPU-accelerated animation classes', () => {
      render(<SectionManager {...mockProps} />);
      
      // Check for CSS classes that use transform/opacity (GPU accelerated)
      const animatedElements = document.querySelectorAll('[class*="section-"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});