import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeIngredientsList } from '../recipe-ingredients-list';
import type { Ingredient } from '@/types/recipe';

const ingredient = (overrides: Partial<Ingredient>): Ingredient => ({
  id: overrides.name ?? 'id',
  name: 'flour',
  amount: 1,
  unit: 'cup',
  position: 0,
  ...overrides,
});

describe('RecipeIngredientsList', () => {
  it('shows groups in order with item counts and sorts items by position', () => {
    render(
      <RecipeIngredientsList
        ingredients={[]}
        ingredientSections={[
          { id: 'f', name: 'Frosting', order: 1, items: [ingredient({ name: 'butter' })] },
          {
            id: 'c',
            name: 'Cake',
            order: 0,
            items: [
              ingredient({ name: 'sugar', position: 1 }),
              ingredient({ name: 'flour', position: 0 }),
            ],
          },
        ]}
        scale={1}
        onScaleChange={jest.fn()}
      />
    );

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['Cake2 items', 'Frosting1 item']);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.map((box) => box.closest('label')?.textContent)).toEqual([
      '1 cupflour',
      '1 cupsugar',
      '1 cupbutter',
    ]);
  });

  it('shows a flat list without group headings, with ingredient notes', () => {
    render(
      <RecipeIngredientsList
        ingredients={[ingredient({ name: 'butter', notes: 'softened' })]}
        scale={1}
        onScaleChange={jest.fn()}
      />
    );

    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText('softened')).toBeInTheDocument();
  });

  it('scales servings and passes scale changes up', () => {
    const onScaleChange = jest.fn();
    render(
      <RecipeIngredientsList
        ingredients={[ingredient({})]}
        servings={4}
        scale={2}
        onScaleChange={onScaleChange}
      />
    );

    expect(screen.getByText('Serves 8')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '½×' }));
    expect(onScaleChange).toHaveBeenCalledWith(0.5);
  });
});
