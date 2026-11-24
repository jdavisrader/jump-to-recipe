import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormActionBar } from '../form-action-bar';

const baseProps = { submitLabel: 'Save changes', isLoading: false, isValid: true, errorCount: 0 };

describe('FormActionBar', () => {
  it('shows Cancel only when there is somewhere to go back to', () => {
    const { rerender } = render(<FormActionBar {...baseProps} />);
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    const onCancel = jest.fn();
    rerender(<FormActionBar {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables Save and says how many errors to fix when invalid', () => {
    render(<FormActionBar {...baseProps} isValid={false} errorCount={2} />);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByText('Fix 2 errors to save')).toBeInTheDocument();
  });

  it('shows a saving state while submitting', () => {
    render(<FormActionBar {...baseProps} isLoading onCancel={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
