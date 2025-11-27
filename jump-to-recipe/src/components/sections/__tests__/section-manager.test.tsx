import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager } from '../section-manager';

interface MockItem {
  id: string;
  name: string;
}

const mockSections = [
  {
    id: 'section-1',
    name: 'Section 1',
    order: 0,
    items: [
      { id: 'item-1', name: 'Item 1' },
      { id: 'item-2', name: 'Item 2' }
    ]
  },
  {
    id: 'section-2',
    name: 'Section 2',
    order: 1,
    items: [
      { id: 'item-3', name: 'Item 3' }
    ]
  }
];

describe('SectionManager', () => {
  const mockOnSectionsChange = jest.fn();
  const mockOnAddItem = jest.fn();
  const mockOnRemoveItem = jest.fn();
  const mockRenderItem = jest.fn((item: MockItem, index: number, sectionId: string) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name} (Section: {sectionId})
    </div>
  ));

  beforeEach(() => {
    mockOnSectionsChange.mockClear();
    mockOnAddItem.mockClear();
    mockOnRemoveItem.mockClear();
    mockRenderItem.mockClear();
  });

  it('renders sections and their items', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-item-3')).toBeInTheDocument();
  });

  it('renders add section button with default label', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('Add Ingredient Section')).toBeInTheDocument();
  });

  it('renders add section button with custom label', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
        addSectionLabel="Custom Add Section"
      />
    );

    expect(screen.getByText('Custom Add Section')).toBeInTheDocument();
  });

  it('renders add item buttons with default labels', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const addButtons = screen.getAllByText('Add Ingredient');
    expect(addButtons).toHaveLength(2); // One for each section
  });

  it('renders add item buttons with custom labels', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
        addItemLabel="Custom Add Item"
      />
    );

    const addButtons = screen.getAllByText('Custom Add Item');
    expect(addButtons).toHaveLength(2);
  });

  it('uses instruction labels when itemType is instruction', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="instruction"
      />
    );

    expect(screen.getByText('Add Instruction Section')).toBeInTheDocument();
    const addButtons = screen.getAllByText('Add Step');
    expect(addButtons).toHaveLength(2);
  });

  it('calls onAddItem when add item button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const addButtons = screen.getAllByText('Add Ingredient');
    await user.click(addButtons[0]);

    expect(mockOnAddItem).toHaveBeenCalledWith('section-1');
  });

  it('calls onSectionsChange when add section button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    await user.click(screen.getByText('Add Ingredient Section'));

    expect(mockOnSectionsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockSections,
        expect.objectContaining({
          name: 'Untitled Section',
          order: 2,
          items: []
        })
      ])
    );
  });

  it('calls onSectionsChange when section is renamed', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    // Click on section title to edit
    await user.click(screen.getByText('Section 1'));
    
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Renamed Section');
    await user.keyboard('{Enter}');

    expect(mockOnSectionsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'section-1',
          name: 'Renamed Section'
        }),
        mockSections[1]
      ])
    );
  });

  it('calls onSectionsChange when section is deleted', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    // Click delete button on first section
    const deleteButtons = screen.getAllByTitle('Delete section');
    await user.click(deleteButtons[0]);

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnSectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'section-2',
        order: 0 // Order should be updated
      })
    ]);
  });

  it('sorts sections by order property', () => {
    const unorderedSections = [
      { ...mockSections[1], order: 0 },
      { ...mockSections[0], order: 1 }
    ];

    render(
      <SectionManager
        sections={unorderedSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const sectionHeaders = screen.getAllByText(/Section \d/);
    expect(sectionHeaders[0]).toHaveTextContent('Section 2');
    expect(sectionHeaders[1]).toHaveTextContent('Section 1');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('calls renderItem with correct parameters', () => {
    render(
      <SectionManager
        sections={mockSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(mockRenderItem).toHaveBeenCalledWith(
      mockSections[0].items[0],
      0,
      'section-1'
    );
    expect(mockRenderItem).toHaveBeenCalledWith(
      mockSections[0].items[1],
      1,
      'section-1'
    );
    expect(mockRenderItem).toHaveBeenCalledWith(
      mockSections[1].items[0],
      0,
      'section-2'
    );
  });

  it('handles empty sections array', () => {
    render(
      <SectionManager
        sections={[]}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('Add Ingredient Section')).toBeInTheDocument();
    expect(screen.queryByText(/Section \d/)).not.toBeInTheDocument();
  });

  it('disables delete when only one section exists', () => {
    const singleSection = [mockSections[0]];
    
    render(
      <SectionManager
        sections={singleSection}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.queryByTitle('Delete section')).not.toBeInTheDocument();
  });

  describe('Simplified rendering without drag-and-drop', () => {
    it('renders sections without drag wrappers', () => {
      const { container } = render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      // Verify no drag-and-drop related elements exist
      expect(screen.queryByTestId('drag-drop-context')).not.toBeInTheDocument();
      expect(screen.queryByTestId('droppable')).not.toBeInTheDocument();
      expect(screen.queryByTestId(/^draggable-/)).not.toBeInTheDocument();
      
      // Verify sections are rendered directly
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });

    it('verifies "Add Section" appends to bottom', async () => {
      const user = userEvent.setup();
      
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      await user.click(screen.getByText('Add Ingredient Section'));

      // Verify the new section is added at the end with correct order
      expect(mockOnSectionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          mockSections[0],
          mockSections[1],
          expect.objectContaining({
            name: 'Untitled Section',
            order: 2, // Should be at the end
            items: []
          })
        ])
      );

      // Verify the order matches the array length
      const calledWith = mockOnSectionsChange.mock.calls[0][0];
      expect(calledWith).toHaveLength(3);
      expect(calledWith[2].order).toBe(2);
    });

    it('verifies section deletion reindexes order correctly', async () => {
      const user = userEvent.setup();
      
      const threeSections = [
        ...mockSections,
        {
          id: 'section-3',
          name: 'Section 3',
          order: 2,
          items: []
        }
      ];

      render(
        <SectionManager
          sections={threeSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      // Delete the middle section (Section 2)
      const deleteButtons = screen.getAllByTitle('Delete section');
      await user.click(deleteButtons[1]);
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      // Verify remaining sections are reindexed
      expect(mockOnSectionsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'section-1',
          order: 0
        }),
        expect.objectContaining({
          id: 'section-3',
          order: 1 // Reindexed from 2 to 1
        })
      ]);
    });

    it('maintains section order stability when adding items', async () => {
      const user = userEvent.setup();
      
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      // Add item to first section
      const addButtons = screen.getAllByText('Add Ingredient');
      await user.click(addButtons[0]);

      // Verify onAddItem was called but onSectionsChange was not
      expect(mockOnAddItem).toHaveBeenCalledWith('section-1');
      expect(mockOnSectionsChange).not.toHaveBeenCalled();
    });

    it('preserves section order when renaming', async () => {
      const user = userEvent.setup();
      
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      // Rename the first section
      await user.click(screen.getByText('Section 1'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Renamed Section');
      await user.keyboard('{Enter}');

      // Verify order is preserved
      expect(mockOnSectionsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'section-1',
          name: 'Renamed Section',
          order: 0 // Order unchanged
        }),
        expect.objectContaining({
          id: 'section-2',
          order: 1 // Order unchanged
        })
      ]);
    });
  });

  describe('Empty state', () => {
    it('displays empty state message when no sections exist', () => {
      render(
        <SectionManager
          sections={[]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      expect(screen.getByText('No sections yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first ingredient section/)).toBeInTheDocument();
    });

    it('displays empty state for instruction type', () => {
      render(
        <SectionManager
          sections={[]}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="instruction"
        />
      );

      expect(screen.getByText(/Create your first instruction section/)).toBeInTheDocument();
    });

    it('shows empty section indicator when section has no items', () => {
      const emptySection = [{
        id: 'section-1',
        name: 'Empty Section',
        order: 0,
        items: []
      }];

      render(
        <SectionManager
          sections={emptySection}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
        />
      );

      expect(screen.getByText(/This section is empty/)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          isLoading={true}
        />
      );

      // Verify skeleton elements are present
      const skeletons = document.querySelectorAll('.section-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Verify actual content is not rendered
      expect(screen.queryByText('Section 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Section 2')).not.toBeInTheDocument();
    });

    it('displays loading state for add section button', () => {
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          isAddingSection={true}
        />
      );

      const addButton = screen.getByText('Add Ingredient Section').closest('button');
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveClass('animate-pulse');
    });

    it('displays loading state for add item buttons', () => {
      render(
        <SectionManager
          sections={mockSections}
          onSectionsChange={mockOnSectionsChange}
          onAddItem={mockOnAddItem}
          onRemoveItem={mockOnRemoveItem}
          renderItem={mockRenderItem}
          itemType="ingredient"
          isAddingItem={{ 'section-1': true }}
        />
      );

      const addButtons = screen.getAllByText('Add Ingredient');
      expect(addButtons[0].closest('button')).toBeDisabled();
      expect(addButtons[0].closest('button')).toHaveClass('animate-pulse');
      expect(addButtons[1].closest('button')).not.toBeDisabled();
    });
  });
});