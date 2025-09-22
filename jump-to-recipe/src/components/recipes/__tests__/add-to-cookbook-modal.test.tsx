import { render, waitFor, fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/dom';

import { AddToCookbookModal } from '../add-to-cookbook-modal';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockCookbooks = [
  {
    id: '1',
    name: 'My Cookbook',
    isChecked: false,
    isOwned: true,
    permission: 'owner' as const,
  },
  {
    id: '2',
    name: 'Shared Cookbook',
    isChecked: true,
    isOwned: false,
    permission: 'edit' as const,
  },
];

describe('AddToCookbookModal', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders modal when open', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cookbooks: mockCookbooks }),
    });

    render(
      <AddToCookbookModal
        recipeId="recipe-1"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Add to Cookbook')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('My Cookbook')).toBeInTheDocument();
      expect(screen.getByText('Shared Cookbook')).toBeInTheDocument();
    });
  });

  it('handles optimistic UI updates', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cookbooks: mockCookbooks }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <AddToCookbookModal
        recipeId="recipe-1"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Cookbook')).toBeInTheDocument();
    });

    // Find the checkbox for "My Cookbook" and click it
    const checkbox = screen.getByRole('checkbox', { name: /my cookbook/i });
    fireEvent.click(checkbox);

    // Should immediately show as checked (optimistic update)
    expect(checkbox).toBeChecked();
  });

  it('reverts optimistic update on API failure', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cookbooks: mockCookbooks }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

    render(
      <AddToCookbookModal
        recipeId="recipe-1"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Cookbook')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /my cookbook/i });
    fireEvent.click(checkbox);

    // Should initially show as checked (optimistic update)
    expect(checkbox).toBeChecked();

    // Wait for API call to fail and revert
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('prevents closing modal when operations are pending', async () => {
    const onClose = jest.fn();
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cookbooks: mockCookbooks }),
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(
      <AddToCookbookModal
        recipeId="recipe-1"
        isOpen={true}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Cookbook')).toBeInTheDocument();
    });

    // Start an operation
    const checkbox = screen.getByRole('checkbox', { name: /my cookbook/i });
    fireEvent.click(checkbox);

    // Try to close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Should not close
    expect(onClose).not.toHaveBeenCalled();
  });
});