import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserListClient } from '../user-list-client';
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

// Mock DeleteUserModal component
jest.mock('../[id]/delete-user-modal', () => ({
  DeleteUserModal: ({ isOpen, user, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-modal="true">
        <h2>Delete User</h2>
        <p>Are you sure you want to delete {user.name}?</p>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockUsers: UserWithCounts[] = [
  {
    id: '1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'admin',
    image: null,
    emailVerified: null,
    password: null,
    recipeCount: 5,
    cookbookCount: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Bob User',
    email: 'bob@example.com',
    role: 'user',
    image: null,
    emailVerified: null,
    password: null,
    recipeCount: 12,
    cookbookCount: 3,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    name: 'Charlie Elevated',
    email: 'charlie@example.com',
    role: 'elevated',
    image: null,
    emailVerified: null,
    password: null,
    recipeCount: 8,
    cookbookCount: 1,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
];

describe('UserListClient', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders user table with all users', () => {
      render(<UserListClient users={mockUsers} />);

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.getByText('Charlie Elevated')).toBeInTheDocument();
    });

    it('displays all required columns', () => {
      render(<UserListClient users={mockUsers} />);

      // Check column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
      expect(screen.getByText('Cookbooks')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays user counts correctly', () => {
      render(<UserListClient users={mockUsers} />);

      // Check recipe counts
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      // Check cookbook counts
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays empty state when no users exist', () => {
      render(<UserListClient users={[]} />);

      expect(screen.getByText('No users in the system')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('filters users by name', () => {
      render(<UserListClient users={mockUsers} />);

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Elevated')).not.toBeInTheDocument();
    });

    it('filters users by email', () => {
      render(<UserListClient users={mockUsers} />);

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'bob@example.com' } });

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.queryByText('Charlie Elevated')).not.toBeInTheDocument();
    });

    it('is case-insensitive', () => {
      render(<UserListClient users={mockUsers} />);

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'ALICE' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    it('shows empty state message when no matches found', () => {
      render(<UserListClient users={mockUsers} />);

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No users match your filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
    });

    it('updates results count when searching', () => {
      render(<UserListClient users={mockUsers} />);

      expect(screen.getByText('Showing 3 of 3 users')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText('Showing 1 of 3 users')).toBeInTheDocument();
    });
  });

  describe('Role filter', () => {
    it('filters users by admin role', () => {
      render(<UserListClient users={mockUsers} />);

      const roleFilter = screen.getByRole('combobox');
      fireEvent.click(roleFilter);

      const adminOption = screen.getByRole('option', { name: 'Admin' });
      fireEvent.click(adminOption);

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Elevated')).not.toBeInTheDocument();
    });

    it('filters users by regular role', () => {
      render(<UserListClient users={mockUsers} />);

      const roleFilter = screen.getByRole('combobox');
      fireEvent.click(roleFilter);

      const userOption = screen.getByRole('option', { name: 'Regular' });
      fireEvent.click(userOption);

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.queryByText('Charlie Elevated')).not.toBeInTheDocument();
    });

    it('filters users by elevated role', () => {
      render(<UserListClient users={mockUsers} />);

      const roleFilter = screen.getByRole('combobox');
      fireEvent.click(roleFilter);

      const elevatedOption = screen.getByRole('option', { name: 'Elevated' });
      fireEvent.click(elevatedOption);

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
      expect(screen.getByText('Charlie Elevated')).toBeInTheDocument();
    });

    it('shows all users when "All Roles" is selected', () => {
      render(<UserListClient users={mockUsers} />);

      // First filter to admin
      const roleFilter = screen.getByRole('combobox');
      fireEvent.click(roleFilter);
      fireEvent.click(screen.getByRole('option', { name: 'Admin' }));

      // Then select "All Roles"
      fireEvent.click(roleFilter);
      fireEvent.click(screen.getByRole('option', { name: 'All Roles' }));

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.getByText('Charlie Elevated')).toBeInTheDocument();
    });

    it('combines search and role filter', () => {
      render(<UserListClient users={mockUsers} />);

      // Search for "e" (matches Alice and Charlie)
      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'e' } });

      // Filter by elevated role
      const roleFilter = screen.getByRole('combobox');
      fireEvent.click(roleFilter);
      fireEvent.click(screen.getByRole('option', { name: 'Elevated' }));

      // Should only show Charlie
      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
      expect(screen.getByText('Charlie Elevated')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by name in ascending order by default', () => {
      render(<UserListClient users={mockUsers} />);

      const rows = screen.getAllByRole('row');
      // Skip header row
      expect(rows[1]).toHaveTextContent('Alice Admin');
      expect(rows[2]).toHaveTextContent('Bob User');
      expect(rows[3]).toHaveTextContent('Charlie Elevated');
    });

    it('sorts by name in descending order when clicked', () => {
      render(<UserListClient users={mockUsers} />);

      const nameHeader = screen.getByRole('button', { name: /name/i });
      fireEvent.click(nameHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Charlie Elevated');
      expect(rows[2]).toHaveTextContent('Bob User');
      expect(rows[3]).toHaveTextContent('Alice Admin');
    });

    it('sorts by email', () => {
      render(<UserListClient users={mockUsers} />);

      const emailHeader = screen.getByRole('button', { name: /email/i });
      fireEvent.click(emailHeader);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('alice@example.com');
      expect(rows[2]).toHaveTextContent('bob@example.com');
      expect(rows[3]).toHaveTextContent('charlie@example.com');
    });

    it('sorts by role', () => {
      render(<UserListClient users={mockUsers} />);

      const roleHeader = screen.getByRole('button', { name: /role/i });
      fireEvent.click(roleHeader);

      const rows = screen.getAllByRole('row');
      // Should sort alphabetically: admin, elevated, user
      expect(rows[1]).toHaveTextContent('admin');
      expect(rows[2]).toHaveTextContent('elevated');
      expect(rows[3]).toHaveTextContent('user');
    });

    it('sorts by recipe count', () => {
      render(<UserListClient users={mockUsers} />);

      const recipesHeader = screen.getByRole('button', { name: /recipes/i });
      fireEvent.click(recipesHeader);

      const rows = screen.getAllByRole('row');
      // Ascending: 5, 8, 12
      expect(rows[1]).toHaveTextContent('Alice Admin');
      expect(rows[2]).toHaveTextContent('Charlie Elevated');
      expect(rows[3]).toHaveTextContent('Bob User');
    });

    it('sorts by cookbook count', () => {
      render(<UserListClient users={mockUsers} />);

      const cookbooksHeader = screen.getByRole('button', { name: /cookbooks/i });
      fireEvent.click(cookbooksHeader);

      const rows = screen.getAllByRole('row');
      // Ascending: 1, 2, 3
      expect(rows[1]).toHaveTextContent('Charlie Elevated');
      expect(rows[2]).toHaveTextContent('Alice Admin');
      expect(rows[3]).toHaveTextContent('Bob User');
    });

    it('sorts by created date', () => {
      render(<UserListClient users={mockUsers} />);

      const createdHeader = screen.getByRole('button', { name: /created/i });
      fireEvent.click(createdHeader);

      const rows = screen.getAllByRole('row');
      // Ascending: Jan, Feb, Mar
      expect(rows[1]).toHaveTextContent('Alice Admin');
      expect(rows[2]).toHaveTextContent('Bob User');
      expect(rows[3]).toHaveTextContent('Charlie Elevated');
    });

    it('sorts by updated date', () => {
      render(<UserListClient users={mockUsers} />);

      const updatedHeader = screen.getByRole('button', { name: /updated/i });
      fireEvent.click(updatedHeader);

      const rows = screen.getAllByRole('row');
      // Ascending: Jan 15, Feb 10, Mar 5
      expect(rows[1]).toHaveTextContent('Alice Admin');
      expect(rows[2]).toHaveTextContent('Bob User');
      expect(rows[3]).toHaveTextContent('Charlie Elevated');
    });

    it('toggles sort direction on repeated clicks', () => {
      render(<UserListClient users={mockUsers} />);

      const nameHeader = screen.getByRole('button', { name: /name/i });
      
      // First click - descending
      fireEvent.click(nameHeader);
      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Charlie Elevated');

      // Second click - ascending
      fireEvent.click(nameHeader);
      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Alice Admin');
    });
  });

  describe('Action buttons', () => {
    it('navigates to user detail page on edit click', () => {
      render(<UserListClient users={mockUsers} />);

      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/admin/users/1');
    });

    it('opens delete modal on delete click', async () => {
      // Mock fetch for transfer candidates
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });

      render(<UserListClient users={mockUsers} />);

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      
      // Verify modal is not visible initially
      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
      
      fireEvent.click(deleteButtons[0]);

      // Modal should be rendered after click
      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders edit and delete buttons for each user', () => {
      render(<UserListClient users={mockUsers} />);

      const editButtons = screen.getAllByLabelText(/edit/i);
      const deleteButtons = screen.getAllByLabelText(/delete/i);

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });
  });
});
