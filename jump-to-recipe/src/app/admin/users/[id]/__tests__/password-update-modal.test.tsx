import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordUpdateModal } from '../password-update-modal';

// Mock fetch
global.fetch = jest.fn();

describe('PasswordUpdateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Modal visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <PasswordUpdateModal
          isOpen={false}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays modal title', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      expect(screen.getByRole('heading', { name: /update password/i })).toBeInTheDocument();
    });

    it('displays password input field', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it('displays description text', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('Password validation', () => {
    it('prevents submission with short password', async () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'short' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      // Should not call API with invalid password
      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it('allows submission with valid password', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      // Should call API with valid password
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('prevents submission with empty password', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const updateButton = screen.getByRole('button', { name: /update password/i });
      expect(updateButton).toBeDisabled();
    });

    it('enables submit button when password is entered', () => {
      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      expect(updateButton).not.toBeDisabled();
    });
  });

  describe('Password update', () => {
    it('calls API with correct data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              role: 'user',
              password: 'newpassword123',
            }),
          })
        );
      });
    });

    it('closes modal on successful update', async () => {
      const onClose = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={onClose}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('clears password field on successful update', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Error handling', () => {
    it('handles API error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Password update failed' }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      // Modal should remain open after error
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('does not close modal on error', async () => {
      const onClose = jest.fn();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Password update failed' }),
      });

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={onClose}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Should not close on error
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('shows loading text during submission', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });
    });

    it('disables buttons during submission', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });
    });

    it('disables password input during submission', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(passwordInput).toBeDisabled();
      });
    });
  });

  describe('Modal close behavior', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={onClose}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close icon is clicked', () => {
      const onClose = jest.fn();

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={onClose}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const closeButton = screen.getByLabelText(/close dialog/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close during submission', async () => {
      const onClose = jest.fn();

      (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={onClose}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const updateButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should not close
      expect(onClose).not.toHaveBeenCalled();
    });

    it('resets state when modal is reopened', () => {
      const { rerender } = render(
        <PasswordUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

      expect(passwordInput.value).toBe('testpassword');

      // Close modal
      rerender(
        <PasswordUpdateModal
          isOpen={false}
          onClose={jest.fn()}
          userId="user-123"
          userName="John Doe"
          userEmail="john@example.com"
          userRole="user"
        />
      );

      // Modal should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
