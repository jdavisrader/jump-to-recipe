import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteUserModal } from '../delete-user-modal';
import type { UserWithCounts } from '@/types/admin';

// Mock dependencies
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser: UserWithCounts = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  image: null,
  emailVerified: null,
  password: null,
  recipeCount: 5,
  cookbookCount: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

const mockTransferCandidates = [
  { id: 'user-456', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-789', name: 'Bob Johnson', email: 'bob@example.com' },
];

describe('DeleteUserModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Modal visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <DeleteUserModal
          isOpen={false}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('displays modal title', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /delete user/i })).toBeInTheDocument();
      });
    });

    it('displays user name in confirmation message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });
    });

    it('displays warning about irreversible action', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/irreversible/i)).toBeInTheDocument();
      });
    });

    it('displays resource counts', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/5/)).toBeInTheDocument(); // recipe count
        expect(screen.getByText(/2/)).toBeInTheDocument(); // cookbook count
      });
    });
  });

  describe('Transfer candidate dropdown', () => {
    it('fetches transfer candidates on mount', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/admin/users/transfer-candidates?excludeUserId=user-123'
        );
      });
    });

    it('displays transfer candidates dropdown', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching candidates', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/loading users/i)).toBeInTheDocument();
      });
    });

    it('handles empty candidates list', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('renders dropdown for selecting transfer candidate', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).not.toBeDisabled();
      });
    });
  });

  describe('Validation', () => {
    it('prevents deletion when no owner is selected', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      fireEvent.click(deleteButton);

      // Should not call delete API without selection
      await waitFor(() => {
        // Only the initial fetch for candidates should have been called
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Deletion flow', () => {
    it('renders delete button', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles fetch error when loading candidates', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      // Modal should still render even if candidates fail to load
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('disables dropdown while loading candidates', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={jest.fn()}
          user={mockUser}
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeDisabled();
      });
    });
  });

  describe('Modal close behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={onClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close icon is clicked', async () => {
      const onClose = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockTransferCandidates }),
      });

      render(
        <DeleteUserModal
          isOpen={true}
          onClose={onClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close dialog/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
