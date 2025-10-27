import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmptySectionWarningModal } from '../empty-section-warning-modal';

describe('EmptySectionWarningModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    emptySections: [
      {
        sectionId: 'section-1',
        sectionName: 'Cake Batter',
        type: 'ingredient' as const,
      },
    ],
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open with single empty section', () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    expect(screen.getByText(/The following section is empty: "Cake Batter" \(ingredient\)/)).toBeInTheDocument();
    expect(screen.getByText('Save Recipe')).toBeInTheDocument();
    expect(screen.getByText('Continue Editing')).toBeInTheDocument();
  });

  it('renders modal with multiple empty sections', () => {
    const multipleEmptySections = [
      {
        sectionId: 'section-1',
        sectionName: 'Cake Batter',
        type: 'ingredient' as const,
      },
      {
        sectionId: 'section-2',
        sectionName: 'Frosting',
        type: 'ingredient' as const,
      },
      {
        sectionId: 'section-3',
        sectionName: 'Assembly',
        type: 'instruction' as const,
      },
    ];

    render(
      <EmptySectionWarningModal
        {...defaultProps}
        emptySections={multipleEmptySections}
      />
    );

    expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    expect(
      screen.getByText(/The following sections are empty: "Cake Batter" \(ingredient\), "Frosting" \(ingredient\), and "Assembly" \(instruction\)/)
    ).toBeInTheDocument();
  });

  it('renders modal with two empty sections', () => {
    const twoEmptySections = [
      {
        sectionId: 'section-1',
        sectionName: 'Cake Batter',
        type: 'ingredient' as const,
      },
      {
        sectionId: 'section-2',
        sectionName: 'Frosting',
        type: 'instruction' as const,
      },
    ];

    render(
      <EmptySectionWarningModal
        {...defaultProps}
        emptySections={twoEmptySections}
      />
    );

    expect(
      screen.getByText(/The following sections are empty: "Cake Batter" \(ingredient\) and "Frosting" \(instruction\)/)
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Save Recipe button is clicked', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    const saveButton = screen.getByText('Save Recipe');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when Continue Editing button is clicked', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    const cancelButton = screen.getByText('Continue Editing');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when X button is clicked', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when Escape key is pressed', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onClose when Escape is pressed while loading', () => {
    render(<EmptySectionWarningModal {...defaultProps} isLoading={true} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(<EmptySectionWarningModal {...defaultProps} isLoading={true} />);

    const saveButton = screen.getByText('Processing...');
    const cancelButton = screen.getByText('Continue Editing');
    const closeButton = screen.getByLabelText('Close dialog');

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('does not render when not open', () => {
    render(<EmptySectionWarningModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
  });

  it('does not render when no empty sections', () => {
    render(<EmptySectionWarningModal {...defaultProps} emptySections={[]} />);

    expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
  });

  it('shows warning variant styling', () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    const warningIcon = screen.getByRole('dialog').querySelector('.lucide-triangle-alert');
    expect(warningIcon).toBeInTheDocument();
  });

  it('includes helpful description text', () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    expect(
      screen.getByText(/Empty sections will be saved with the recipe but won't contain any items/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You can add items to these sections later by editing the recipe/)
    ).toBeInTheDocument();
  });

  it('focuses the confirm button when modal opens', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Recipe');
      expect(saveButton).toHaveFocus();
    });
  });

  it('has proper focus management', async () => {
    render(<EmptySectionWarningModal {...defaultProps} />);

    const saveButton = screen.getByText('Save Recipe');
    const cancelButton = screen.getByText('Continue Editing');
    const closeButton = screen.getByLabelText('Close dialog');

    // All buttons should be focusable
    expect(saveButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
    expect(closeButton).not.toBeDisabled();
  });
});