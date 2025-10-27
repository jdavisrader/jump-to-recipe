import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeForm } from '../recipe-form';

// Mock the validation function
const mockValidateRecipeWithSections = jest.fn();

jest.mock('../../../lib/validations/recipe', () => ({
  ...jest.requireActual('../../../lib/validations/recipe'),
  validateRecipeWithSections: mockValidateRecipeWithSections,
}));



describe('RecipeForm Empty Section Validation', () => {
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: { emptySections: [] },
    });
  });

  const fillBasicRecipeForm = async () => {
    await user.type(screen.getByLabelText(/recipe title/i), 'Test Recipe');
    await user.type(screen.getByLabelText(/description/i), 'A test recipe');
  };

  it('submits recipe without showing warning when no empty sections', async () => {
    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    // Should not show empty section warning modal
    expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
  });

  it('shows warning modal when empty sections are detected', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    // Should show empty section warning modal
    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    expect(screen.getByText(/The following section is empty: "Dry Ingredients" \(ingredient\)/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits recipe when user confirms saving with empty sections', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    // Click "Save Recipe" in the modal
    const confirmButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    // Modal should be closed
    expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
  });

  it('cancels submission when user chooses to continue editing', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    // Click "Continue Editing" in the modal
    const cancelButton = screen.getByRole('button', { name: /continue editing/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows warning for multiple empty sections', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
          {
            sectionId: 'section-2',
            sectionName: 'Wet Ingredients',
            type: 'ingredient',
          },
          {
            sectionId: 'section-3',
            sectionName: 'Assembly',
            type: 'instruction',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/The following sections are empty: "Dry Ingredients" \(ingredient\), "Wet Ingredients" \(ingredient\), and "Assembly" \(instruction\)/)
    ).toBeInTheDocument();
  });

  it('handles loading state during submission', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} isLoading={true} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /saving.../i });
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);

    // Modal should not appear when form is in loading state
    expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
  });

  it('closes modal when clicking backdrop', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    // Click on the backdrop (modal overlay)
    const modal = screen.getByRole('dialog');
    const backdrop = modal.parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('closes modal when pressing Escape key', async () => {
    mockValidateRecipeWithSections.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: {
        emptySections: [
          {
            sectionId: 'section-1',
            sectionName: 'Dry Ingredients',
            type: 'ingredient',
          },
        ],
      },
    });

    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Empty Sections Detected')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Empty Sections Detected')).not.toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls validation function with correct form data', async () => {
    render(<RecipeForm onSubmit={mockOnSubmit} />);

    await fillBasicRecipeForm();

    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockValidateRecipeWithSections).toHaveBeenCalledTimes(1);
    });

    const callArgs = mockValidateRecipeWithSections.mock.calls[0][0];
    expect(callArgs).toMatchObject({
      title: 'Test Recipe',
      description: 'A test recipe',
    });
  });
});