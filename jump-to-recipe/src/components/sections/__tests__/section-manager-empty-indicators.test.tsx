import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionManager, Section } from '../section-manager';

describe('SectionManager Empty Section Indicators', () => {
  const mockOnSectionsChange = jest.fn();
  const mockOnAddItem = jest.fn();
  const mockOnRemoveItem = jest.fn();
  const mockRenderItem = jest.fn((item, index, sectionId) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name}
    </div>
  ));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createSection = (id: string, name: string, items: any[] = []): Section => ({
    id,
    name,
    order: 0,
    items,
  });

  it('shows empty section indicator for ingredient sections with no items', () => {
    const emptySections = [
      createSection('section-1', 'Dry Ingredients', []),
    ];

    render(
      <SectionManager
        sections={emptySections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('This section is empty. Add ingredients below.')).toBeInTheDocument();
  });

  it('shows empty section indicator for instruction sections with no items', () => {
    const emptySections = [
      createSection('section-1', 'Preparation', []),
    ];

    render(
      <SectionManager
        sections={emptySections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="instruction"
      />
    );

    expect(screen.getByText('This section is empty. Add steps below.')).toBeInTheDocument();
  });

  it('does not show empty indicator for sections with items', () => {
    const sectionsWithItems = [
      createSection('section-1', 'Dry Ingredients', [
        { id: 'item-1', name: 'Flour' },
      ]),
    ];

    render(
      <SectionManager
        sections={sectionsWithItems}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.queryByText('This section is empty. Add ingredients below.')).not.toBeInTheDocument();
    expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
  });

  it('shows empty indicators for multiple empty sections', () => {
    const multipleSections = [
      createSection('section-1', 'Dry Ingredients', []),
      createSection('section-2', 'Wet Ingredients', []),
      createSection('section-3', 'Spices', [
        { id: 'item-1', name: 'Salt' },
      ]),
    ];

    render(
      <SectionManager
        sections={multipleSections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const emptyIndicators = screen.getAllByText('This section is empty. Add ingredients below.');
    expect(emptyIndicators).toHaveLength(2);
    
    // Third section should have its item, not an empty indicator
    expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
  });

  it('applies correct styling to empty section indicator', () => {
    const emptySections = [
      createSection('section-1', 'Dry Ingredients', []),
    ];

    render(
      <SectionManager
        sections={emptySections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const indicator = screen.getByText('This section is empty. Add ingredients below.');
    const indicatorContainer = indicator.parentElement;

    expect(indicatorContainer).toHaveClass('flex', 'items-center', 'gap-2', 'p-3');
    expect(indicatorContainer).toHaveClass('border-2', 'border-dashed', 'border-amber-200');
    expect(indicatorContainer).toHaveClass('bg-amber-50', 'rounded-lg', 'text-amber-700', 'text-sm');
  });

  it('includes visual dot indicator in empty section message', () => {
    const emptySections = [
      createSection('section-1', 'Dry Ingredients', []),
    ];

    render(
      <SectionManager
        sections={emptySections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    const indicator = screen.getByText('This section is empty. Add ingredients below.');
    const indicatorContainer = indicator.parentElement;
    const dot = indicatorContainer?.querySelector('.w-2.h-2.bg-amber-400.rounded-full');

    expect(dot).toBeInTheDocument();
  });

  it('shows empty indicator even when section has a custom name', () => {
    const emptySections = [
      createSection('section-1', 'My Custom Section Name', []),
    ];

    render(
      <SectionManager
        sections={emptySections}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('This section is empty. Add ingredients below.')).toBeInTheDocument();
  });

  it('updates empty indicator visibility when items are added/removed', () => {
    const { rerender } = render(
      <SectionManager
        sections={[createSection('section-1', 'Ingredients', [])]}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    // Initially empty - should show indicator
    expect(screen.getByText('This section is empty. Add ingredients below.')).toBeInTheDocument();

    // Add an item - should hide indicator
    rerender(
      <SectionManager
        sections={[createSection('section-1', 'Ingredients', [{ id: 'item-1', name: 'Flour' }])]}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.queryByText('This section is empty. Add ingredients below.')).not.toBeInTheDocument();
    expect(screen.getByTestId('item-item-1')).toBeInTheDocument();

    // Remove the item - should show indicator again
    rerender(
      <SectionManager
        sections={[createSection('section-1', 'Ingredients', [])]}
        onSectionsChange={mockOnSectionsChange}
        onAddItem={mockOnAddItem}
        onRemoveItem={mockOnRemoveItem}
        renderItem={mockRenderItem}
        itemType="ingredient"
      />
    );

    expect(screen.getByText('This section is empty. Add ingredients below.')).toBeInTheDocument();
  });
});