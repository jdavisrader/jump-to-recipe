import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteRecipeSection } from '../delete-recipe-section';

const push = jest.fn();
const toast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({ toast }),
}));

describe('DeleteRecipeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock;
  });

  it('renders as a danger panel with a heading and warning', () => {
    render(<DeleteRecipeSection recipeId="r1" recipeTitle="Banana bread" />);

    expect(screen.getByRole('region', { name: 'Delete this recipe' })).toBeInTheDocument();
    expect(
      screen.getByText("It will be removed from your cookbook. This can't be undone.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete recipe: Banana bread' })).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('asks for confirmation before deleting', async () => {
    render(<DeleteRecipeSection recipeId="r1" recipeTitle="Banana bread" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete recipe: Banana bread' }));
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/my-recipes'));
    expect(global.fetch).toHaveBeenCalledWith('/api/recipes/r1', { method: 'DELETE' });
  });
});
