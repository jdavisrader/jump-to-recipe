import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { RecipeMethod } from '../recipe-method';
import { getMethodSectionId } from '../recipe-jump-nav';
import type { Instruction } from '@/types/recipe';

const step = (content: string, position: number, duration?: number): Instruction => ({
  id: content,
  step: position + 1,
  content,
  position,
  duration,
});

describe('RecipeMethod', () => {
  it('numbers sections as parts and steps by position within each section', () => {
    render(
      <RecipeMethod
        instructions={[]}
        instructionSections={[
          { id: 'b', name: 'Frost', order: 1, items: [step('Spread', 0)] },
          { id: 'a', name: 'Bake', order: 0, items: [step('Pour', 1), step('Heat oven', 0)] },
        ]}
      />
    );

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();

    const bake = document.getElementById(getMethodSectionId(1))!;
    expect(within(bake).getByRole('heading', { name: 'Bake' })).toBeInTheDocument();
    const steps = within(bake).getAllByRole('listitem');
    expect(steps.map((item) => item.textContent)).toEqual(['1Step 1: Heat oven', '2Step 2: Pour']);
  });

  it('shows a flat list without part labels, with step durations', () => {
    render(<RecipeMethod instructions={[step('Mix', 0, 5)]} />);

    expect(screen.queryByText(/Part/)).not.toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Method' })).toBeInTheDocument();
  });
});
