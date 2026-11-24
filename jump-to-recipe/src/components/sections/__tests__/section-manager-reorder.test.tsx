import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionManager, type Section } from '../section-manager';

interface MockItem {
  id: string;
  name: string;
}

const initialSections: Section<MockItem>[] = [
  { id: 's-1', name: 'Cake', order: 0, items: [{ id: 'i-1', name: 'Flour' }] },
  { id: 's-2', name: 'Filling', order: 1, items: [{ id: 'i-2', name: 'Jam' }] },
  { id: 's-3', name: 'Frosting', order: 2, items: [{ id: 'i-3', name: 'Butter' }] },
];

function renderManager(onSectionsChange = jest.fn(), sections = initialSections) {
  render(
    <SectionManager
      sections={sections}
      onSectionsChange={onSectionsChange}
      onAddItem={jest.fn()}
      onRemoveItem={jest.fn()}
      renderItem={(item: MockItem) => <div>{item.name}</div>}
      itemType="ingredient"
    />
  );
  return onSectionsChange;
}

// Keeps sections in state so moves re-render, like the real editors do
function StatefulManager({ onChange }: { onChange: (sections: Section<MockItem>[]) => void }) {
  const [sections, setSections] = useState(initialSections);
  return (
    <SectionManager
      sections={sections}
      onSectionsChange={(next) => {
        setSections(next);
        onChange(next);
      }}
      onAddItem={jest.fn()}
      onRemoveItem={jest.fn()}
      renderItem={(item: MockItem) => <div>{item.name}</div>}
      itemType="ingredient"
    />
  );
}

const headingNames = () =>
  screen.getAllByRole('group').map((group) => group.getAttribute('aria-labelledby'));

describe('SectionManager section reorder', () => {
  const user = userEvent.setup();

  it('hides Up on the first section and Down on the last', () => {
    renderManager();

    expect(screen.queryByRole('button', { name: 'Move Cake up' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Cake down' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Filling up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Filling down' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Frosting up' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move Frosting down' })).not.toBeInTheDocument();
  });

  it('shows no arrows when there is only one section', () => {
    renderManager(jest.fn(), [initialSections[0]]);

    expect(screen.queryByRole('button', { name: /^Move Cake/ })).not.toBeInTheDocument();
  });

  it('swaps a section with the one above and renumbers order from 0', async () => {
    const onSectionsChange = renderManager();

    await user.click(screen.getByRole('button', { name: 'Move Frosting up' }));

    const result = onSectionsChange.mock.calls[0][0] as Section<MockItem>[];
    expect(result.map((s) => s.name)).toEqual(['Cake', 'Frosting', 'Filling']);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
    // Items travel with their section
    expect(result[1].items).toEqual([{ id: 'i-3', name: 'Butter' }]);
  });

  it('swaps a section with the one below', async () => {
    const onSectionsChange = renderManager();

    await user.click(screen.getByRole('button', { name: 'Move Cake down' }));

    const result = onSectionsChange.mock.calls[0][0] as Section<MockItem>[];
    expect(result.map((s) => s.name)).toEqual(['Filling', 'Cake', 'Frosting']);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it('sorts by order first, so out-of-order input still moves the right neighbour', async () => {
    const shuffled = [initialSections[2], initialSections[0], initialSections[1]];
    const onSectionsChange = renderManager(jest.fn(), shuffled);

    await user.click(screen.getByRole('button', { name: 'Move Filling up' }));

    const result = onSectionsChange.mock.calls[0][0] as Section<MockItem>[];
    expect(result.map((s) => s.name)).toEqual(['Filling', 'Cake', 'Frosting']);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it('re-renders in the new order and keeps focus on the moved section', async () => {
    const onChange = jest.fn();
    render(<StatefulManager onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Move Filling up' }));

    expect(headingNames()).toEqual(['section-s-2-title', 'section-s-1-title', 'section-s-3-title']);
    // Filling is now first, so its Up arrow is gone and focus falls back to Down
    expect(screen.queryByRole('button', { name: 'Move Filling up' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Filling down' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Move Filling down' }));
    expect(headingNames()).toEqual(['section-s-1-title', 'section-s-2-title', 'section-s-3-title']);
    expect(screen.getByRole('button', { name: 'Move Filling down' })).toHaveFocus();
  });
});
