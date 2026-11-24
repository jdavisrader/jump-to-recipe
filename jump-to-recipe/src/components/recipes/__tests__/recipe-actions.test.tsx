import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeActions } from '../recipe-actions';

const mockToast = jest.fn();
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

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

  it('copies the page link and confirms with a toast when Share is clicked', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<RecipeActions recipeId="recipe-1" canEdit={false} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Link copied' }))
    );
  });

  it('opens the print dialog when Print is clicked', () => {
    const print = jest.spyOn(window, 'print').mockImplementation(() => {});
    render(<RecipeActions recipeId="recipe-1" canEdit={false} />);

    fireEvent.click(screen.getByRole('button', { name: /print/i }));

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
