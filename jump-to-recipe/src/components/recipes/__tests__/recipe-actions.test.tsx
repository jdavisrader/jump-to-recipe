import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeActions } from '../recipe-actions';

jest.mock('../add-to-cookbook-button', () => ({
  AddToCookbookButton: () => <button>Add to Cookbook</button>,
}));

describe('RecipeActions', () => {
  it('always shows Add to Cookbook', () => {
    render(<RecipeActions recipeId="recipe-1" canEdit={false} />);

    expect(screen.getByRole('button', { name: 'Add to Cookbook' })).toBeInTheDocument();
  });

  it('shows Edit only when the user can edit', () => {
    const { rerender } = render(<RecipeActions recipeId="recipe-1" canEdit={false} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();

    rerender(<RecipeActions recipeId="recipe-1" canEdit />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('calls onEdit when Edit is clicked', () => {
    const onEdit = jest.fn();
    render(<RecipeActions recipeId="recipe-1" canEdit onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('links to the source in a new tab only when there is a source URL', () => {
    const { rerender } = render(<RecipeActions recipeId="recipe-1" canEdit={false} />);
    expect(screen.queryByRole('link', { name: /source/i })).not.toBeInTheDocument();

    rerender(
      <RecipeActions recipeId="recipe-1" canEdit={false} sourceUrl="https://example.com/recipe" />
    );
    const link = screen.getByRole('link', { name: /source/i });
    expect(link).toHaveAttribute('href', 'https://example.com/recipe');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
