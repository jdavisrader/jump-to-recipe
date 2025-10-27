import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager } from '../section-manager';

// Mock @hello-pangea/dnd
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children }: any) => (
    <div data-testid="droppable">
      {children({ 
        droppableProps: {}, 
        innerRef: () => {}, 
        placeholder: <div data-testid="placeholder" /> 
      }, { isDraggingOver: false })}
    </div>
  ),
  Draggable: ({ children, draggableId }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children(
        { 
          innerRef: () => {}, 
          draggableProps: {}, 
          dragHandleProps: {} 
        },
        { isDragging: false }
      )}
    </div>
  ),
}));

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
    render(
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

    const container = screen.getByTestId('drag-drop-context').parentElement;
    expect(container).toHaveClass('custom-class');
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
});