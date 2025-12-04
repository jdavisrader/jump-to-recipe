import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserEditForm } from '../user-edit-form';
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

// Mock the modal components
jest.mock('../password-update-modal', () => ({
    PasswordUpdateModal: ({ isOpen, onClose }: any) => {
        if (!isOpen) return null;
        return (
            <div role="dialog" data-testid="password-modal">
                <h2>Update Password</h2>
                <button onClick={onClose}>Close</button>
            </div>
        );
    },
}));

jest.mock('../delete-user-modal', () => ({
    DeleteUserModal: ({ isOpen, onClose }: any) => {
        if (!isOpen) return null;
        return (
            <div role="dialog" data-testid="delete-modal">
                <h2>Delete User</h2>
                <button onClick={onClose}>Close</button>
            </div>
        );
    },
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

describe('UserEditForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();
    });

    describe('Form rendering', () => {
        it('renders all form fields', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByText('User ID')).toBeInTheDocument();
            expect(screen.getByLabelText('Name')).toBeInTheDocument();
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Role')).toBeInTheDocument();
            expect(screen.getByText('Password')).toBeInTheDocument();
            expect(screen.getByText('Created')).toBeInTheDocument();
            expect(screen.getByText('Updated')).toBeInTheDocument();
        });

        it('displays user data in form fields', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('user-123')).toBeInTheDocument();
        });

        it('displays resource counts', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByText('Resources')).toBeInTheDocument();
            expect(screen.getByText(/Recipes:/)).toBeInTheDocument();
            expect(screen.getByText(/5/)).toBeInTheDocument();
            expect(screen.getByText(/Cookbooks:/)).toBeInTheDocument();
            expect(screen.getByText(/2/)).toBeInTheDocument();
        });

        it('renders Save Changes button', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });

        it('renders Delete User button', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByRole('button', { name: /delete user/i })).toBeInTheDocument();
        });

        it('renders Back to Users button', () => {
            render(<UserEditForm user={mockUser} />);

            expect(screen.getByRole('button', { name: /back to users/i })).toBeInTheDocument();
        });

        it('disables User ID field', () => {
            render(<UserEditForm user={mockUser} />);

            const userIdInput = screen.getByDisplayValue('user-123');
            expect(userIdInput).toBeDisabled();
        });

        it('disables Created and Updated fields', () => {
            render(<UserEditForm user={mockUser} />);

            // Find disabled inputs by their values since labels might not be properly associated
            const inputs = screen.getAllByRole('textbox');
            const disabledInputs = inputs.filter(input => (input as HTMLInputElement).disabled);

            // Should have at least 3 disabled fields (User ID, Created, Updated)
            expect(disabledInputs.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Form validation', () => {
        it('prevents submission with empty name', async () => {
            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: '' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });

            // Button should be enabled (form is dirty) but submission should fail validation
            expect(saveButton).not.toBeDisabled();

            fireEvent.click(saveButton);

            // Validation should prevent the fetch call
            await waitFor(() => {
                expect(fetch).not.toHaveBeenCalled();
            });
        });

        it('prevents submission with invalid email', async () => {
            render(<UserEditForm user={mockUser} />);

            const emailInput = screen.getByLabelText('Email');
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            // Validation should prevent the fetch call
            await waitFor(() => {
                expect(fetch).not.toHaveBeenCalled();
            });
        });

        it('allows submission with valid inputs', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, user: mockUser }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            // Should allow submission with valid data
            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
            });
        });
    });

    describe('Form submission', () => {
        it('submits form with updated data', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, user: { ...mockUser, name: 'Jane Doe' } }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    '/api/admin/users/user-123',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: 'Jane Doe',
                            email: 'john@example.com',
                            role: 'user',
                        }),
                    })
                );
            });
        });

        it('completes submission successfully', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, user: mockUser }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
                expect(mockRefresh).toHaveBeenCalled();
            });
        });

        it('handles submission failure', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Email already exists' }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
                // Button should be re-enabled after error
                expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
            });
        });

        it('refreshes router after successful submission', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, user: mockUser }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockRefresh).toHaveBeenCalled();
            });
        });
    });

    describe('Save button state', () => {
        it('disables Save button when form is pristine', () => {
            render(<UserEditForm user={mockUser} />);

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            expect(saveButton).toBeDisabled();
        });

        it('enables Save button when form is dirty', () => {
            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            expect(saveButton).not.toBeDisabled();
        });

        it('disables Save button during submission', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { })); // Never resolves

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
            });
        });

        it('shows "Saving..." text during submission', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { })); // Never resolves

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/saving/i)).toBeInTheDocument();
            });
        });

        it('re-enables Save button after submission error', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Server error' }),
            });

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            // Button should be enabled again after error
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
            });
        });
    });

    describe('Password modal', () => {
        it('opens password modal when password button is clicked', () => {
            render(<UserEditForm user={mockUser} />);

            const passwordButton = screen.getByRole('button', { name: /update password/i });
            fireEvent.click(passwordButton);

            expect(screen.getByTestId('password-modal')).toBeInTheDocument();
        });

        it('closes password modal when close is triggered', () => {
            render(<UserEditForm user={mockUser} />);

            const passwordButton = screen.getByRole('button', { name: /update password/i });
            fireEvent.click(passwordButton);

            expect(screen.getByTestId('password-modal')).toBeInTheDocument();

            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(screen.queryByTestId('password-modal')).not.toBeInTheDocument();
        });
    });

    describe('Delete modal', () => {
        it('opens delete modal when delete button is clicked', () => {
            render(<UserEditForm user={mockUser} />);

            const deleteButton = screen.getByRole('button', { name: /delete user/i });
            fireEvent.click(deleteButton);

            expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
        });

        it('closes delete modal when close is triggered', () => {
            render(<UserEditForm user={mockUser} />);

            const deleteButton = screen.getByRole('button', { name: /delete user/i });
            fireEvent.click(deleteButton);

            expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
        });

        it('does not open delete modal during form submission', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { })); // Never resolves

            render(<UserEditForm user={mockUser} />);

            const nameInput = screen.getByLabelText('Name');
            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/saving/i)).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete user/i });
            expect(deleteButton).toBeDisabled();
        });
    });

    describe('Navigation', () => {
        it('navigates back to user list when back button is clicked', () => {
            render(<UserEditForm user={mockUser} />);

            const backButton = screen.getByRole('button', { name: /back to users/i });
            fireEvent.click(backButton);

            expect(mockPush).toHaveBeenCalledWith('/admin/users');
        });
    });

    describe('Role selection', () => {
        it('updates role when role dropdown is changed', async () => {
            render(<UserEditForm user={mockUser} />);

            const roleSelect = screen.getByRole('combobox');
            fireEvent.click(roleSelect);

            const adminOption = screen.getByRole('option', { name: 'Admin' });
            fireEvent.click(adminOption);

            // Save button should be enabled
            const saveButton = screen.getByRole('button', { name: /save changes/i });
            expect(saveButton).not.toBeDisabled();
        });

        it('submits updated role', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, user: { ...mockUser, role: 'admin' } }),
            });

            render(<UserEditForm user={mockUser} />);

            const roleSelect = screen.getByRole('combobox');
            fireEvent.click(roleSelect);

            const adminOption = screen.getByRole('option', { name: 'Admin' });
            fireEvent.click(adminOption);

            const saveButton = screen.getByRole('button', { name: /save changes/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    '/api/admin/users/user-123',
                    expect.objectContaining({
                        body: JSON.stringify({
                            name: 'John Doe',
                            email: 'john@example.com',
                            role: 'admin',
                        }),
                    })
                );
            });
        });
    });
});
