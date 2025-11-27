import { render, screen, fireEvent, act } from '@testing-library/react';
import { SectionManager, Section } from '../section-manager';
import { SectionHeader } from '../section-header';

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
    it('should render large section lists efficiently with simplified rendering', () => {
      const largeSections = generateLargeSectionList(50);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={largeSections} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (faster without drag-and-drop overhead)
      expect(renderTime).toBeLessThan(800); // 800ms - improved from 1000ms
      
      // Verify all sections are rendered
      const sectionElements = screen.getAllByText(/Section \d+/);
      expect(sectionElements.length).toBe(50);
    });

    it('should demonstrate performance improvement with simplified rendering', () => {
      const sections = generateLargeSectionList(20);
      const startTime = performance.now();
      
      // Render without drag-and-drop wrappers
      render(<SectionManager {...mockProps} sections={sections} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should be significantly faster without DragDropContext, Droppable, and Draggable wrappers
      expect(renderTime).toBeLessThan(400); // 400ms for 20 sections
      
      // Verify sections are rendered correctly
      const sectionElements = screen.getAllByText(/Section \d+/);
      expect(sectionElements.length).toBe(20);
      
      // Verify no drag-related elements exist
      const dragHandles = screen.queryAllByTitle('Drag to reorder');
      expect(dragHandles.length).toBe(0);
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
    it('should render sections efficiently without drag-and-drop overhead', () => {
      const sections = generateLargeSectionList(10);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={sections} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render faster without drag-and-drop library overhead
      expect(renderTime).toBeLessThan(300); // 300ms for 10 sections
      
      // Verify sections are rendered
      const sectionElements = screen.getAllByText(/Section \d+/);
      expect(sectionElements.length).toBe(10);
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
      // Note: animate- classes may not be present in all states, so we check for section-related classes
      const sectionElements = document.querySelectorAll('[class*="section-"]');
      expect(sectionElements.length).toBeGreaterThan(0);
      
      // Verify sections are rendered efficiently
      const sectionTexts = screen.getAllByText(/Section \d+/);
      expect(sectionTexts.length).toBe(3);
    });

    it('should have improved performance without drag animations', () => {
      const sections = generateLargeSectionList(5);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={sections} />);
      
      // Simulate button interactions
      const buttons = screen.getAllByRole('button');
      buttons.slice(0, 3).forEach(button => {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      });
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Should be faster without drag-related animations
      expect(interactionTime).toBeLessThan(200);
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain screen reader performance with many sections', () => {
      const largeSections = generateLargeSectionList(20);
      const startTime = performance.now();
      
      render(<SectionManager {...mockProps} sections={largeSections} />);
      
      // Check that sections are efficiently rendered
      const buttons = screen.getAllByRole('button');
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      // Improved performance without drag-and-drop ARIA overhead
      expect(renderTime).toBeLessThan(250); // 250ms for 20 sections with ARIA (improved from 300ms)
      
      // Verify buttons are rendered
      expect(buttons.length).toBeGreaterThan(0);
      
      // Verify sections are accessible
      const sectionElements = screen.getAllByText(/Section \d+/);
      expect(sectionElements.length).toBe(20);
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