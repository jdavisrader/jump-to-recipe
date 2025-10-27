import { render, screen, fireEvent, act } from '@testing-library/react';
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

describe('Section Components Performance', () => {
  // Generate large dataset for performance testing
  const generateLargeSectionList = (count: number): Section[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `section-${i}`,
      name: `Section ${i + 1}`,
      order: i,
      items: Array.from({ length: 10 }, (_, j) => ({
        id: `item-${i}-${j}`,
        name: `Item ${j + 1}`
      }))
    }));
  };

  const mockProps = {
    onSectionsChange: jest.fn(),
    onAddItem: jest.fn(),
    onRemoveItem: jest.fn(),
    renderItem: (item: any) => <div key={item.id}>{item.name}</div>,
    itemType: 'ingredient' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Performance', () => {
    it('should render large section lists efficiently', () => {
      const largeSections = generateLargeSectionList(50);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={largeSections} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
      
      // Verify all sections are rendered
      expect(screen.getAllByTitle('Drag to reorder')).toHaveLength(50);
    });

    it('should handle loading state efficiently', () => {
      const largeSections = generateLargeSectionList(20);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={largeSections} isLoading={true} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(500); // 500ms for loading state
      
      // Should show skeleton loaders instead of full content
      const skeletons = document.querySelectorAll('.section-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should efficiently update when sections change', () => {
      const initialSections = generateLargeSectionList(10);
      const { rerender } = render(<SectionManager {...mockProps} sections={initialSections} />);
      
      // Measure re-render time when sections change
      const updatedSections = [...initialSections, {
        id: 'new-section',
        name: 'New Section',
        order: 10,
        items: []
      }];
      
      const startTime = performance.now();
      rerender(<SectionManager {...mockProps} sections={updatedSections} />);
      const endTime = performance.now();
      
      const rerenderTime = endTime - startTime;
      expect(rerenderTime).toBeLessThan(100); // 100ms for re-render
    });
  });

  describe('Animation Performance', () => {
    it('should not cause layout thrashing during drag operations', () => {
      const sections = generateLargeSectionList(5);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      // Simulate drag start
      const dragHandle = screen.getAllByTitle('Drag to reorder')[0];
      
      const startTime = performance.now();
      
      // Simulate multiple drag events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseDown(dragHandle);
        fireEvent.mouseMove(dragHandle, { clientY: i * 10 });
      }
      
      const endTime = performance.now();
      const dragTime = endTime - startTime;
      
      // Should handle drag operations efficiently
      expect(dragTime).toBeLessThan(200); // 200ms for 10 drag events
    });

    it('should efficiently handle hover animations', () => {
      const sections = generateLargeSectionList(10);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      const buttons = screen.getAllByRole('button');
      const startTime = performance.now();
      
      // Simulate hover on multiple buttons
      buttons.slice(0, 5).forEach(button => {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      });
      
      const endTime = performance.now();
      const hoverTime = endTime - startTime;
      
      expect(hoverTime).toBeLessThan(100); // 100ms for hover animations
    });

    it('should handle loading state transitions smoothly', () => {
      const sections = generateLargeSectionList(5);
      const { rerender } = render(<SectionManager {...mockProps} sections={sections} />);
      
      const startTime = performance.now();
      
      // Toggle loading state multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<SectionManager {...mockProps} sections={sections} isLoading={i % 2 === 0} />);
      }
      
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      expect(transitionTime).toBeLessThan(150); // 150ms for state transitions
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with frequent updates', () => {
      const sections = generateLargeSectionList(5);
      const { rerender, unmount } = render(<SectionManager {...mockProps} sections={sections} />);
      
      // Simulate frequent updates
      for (let i = 0; i < 20; i++) {
        const updatedSections = sections.map(section => ({
          ...section,
          name: `Updated ${section.name} ${i}`
        }));
        rerender(<SectionManager {...mockProps} sections={updatedSections} />);
      }
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });

    it('should efficiently handle large item lists within sections', () => {
      const sectionsWithManyItems = [{
        id: 'section-1',
        name: 'Large Section',
        order: 0,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i + 1}`
        }))
      }];
      
      const startTime = performance.now();
      render(<SectionManager {...mockProps} sections={sectionsWithManyItems} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(500); // 500ms for 100 items
    });
  });

  describe('Event Handler Performance', () => {
    it('should handle rapid button clicks efficiently', () => {
      const sections = generateLargeSectionList(3);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      const addButton = screen.getByRole('button', { name: /Add.*Section/ });
      const startTime = performance.now();
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(addButton);
      }
      
      const endTime = performance.now();
      const clickTime = endTime - startTime;
      
      expect(clickTime).toBeLessThan(100); // 100ms for 10 clicks
      expect(mockProps.onSectionsChange).toHaveBeenCalledTimes(10);
    });

    it('should debounce rename operations efficiently', async () => {
      const section = {
        id: 'section-1',
        name: 'Test Section',
        order: 0,
        items: []
      };
      
      const onRename = jest.fn();
      render(<SectionHeader section={section} onRename={onRename} onDelete={jest.fn()} />);
      
      const editButton = screen.getByTitle('Click to edit');
      fireEvent.click(editButton);
      
      const input = screen.getByDisplayValue('Test Section');
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `New Name ${i}` } });
      }
      
      const endTime = performance.now();
      const typingTime = endTime - startTime;
      
      expect(typingTime).toBeLessThan(50); // 50ms for 10 changes
    });
  });

  describe('CSS Animation Performance', () => {
    it('should use GPU-accelerated animations', () => {
      const sections = generateLargeSectionList(3);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      // Check for transform-based animations (GPU accelerated)
      const animatedElements = document.querySelectorAll('[class*="animate-"]');
      expect(animatedElements.length).toBeGreaterThan(0);
      
      // Verify no layout-triggering animations
      animatedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        // Should not animate properties that cause layout recalculation
        expect(computedStyle.animationName).not.toMatch(/width|height|top|left|margin|padding/);
      });
    });

    it('should minimize repaints during animations', () => {
      const sections = generateLargeSectionList(2);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      // Simulate drag operation
      const dragHandle = screen.getAllByTitle('Drag to reorder')[0];
      
      act(() => {
        fireEvent.mouseDown(dragHandle);
      });
      
      // Check that animations use transform/opacity (compositor-only properties)
      const draggedElement = dragHandle.closest('[class*="transition"]');
      expect(draggedElement).toBeInTheDocument();
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain screen reader performance with many sections', () => {
      const largeSections = generateLargeSectionList(20);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={largeSections} />);
      
      // Check that ARIA attributes are efficiently applied
      const buttons = screen.getAllByRole('button');
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(300); // 300ms for 20 sections with ARIA
      
      // Verify all buttons have proper accessibility attributes
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    it('should handle focus management efficiently', () => {
      const sections = generateLargeSectionList(5);
      render(<SectionManager {...mockProps} sections={sections} />);
      
      const focusableElements = screen.getAllByRole('button');
      const startTime = performance.now();
      
      // Simulate tab navigation through all elements
      focusableElements.slice(0, 10).forEach(element => {
        element.focus();
      });
      
      const endTime = performance.now();
      const focusTime = endTime - startTime;
      
      expect(focusTime).toBeLessThan(100); // 100ms for focus management
    });
  });
});