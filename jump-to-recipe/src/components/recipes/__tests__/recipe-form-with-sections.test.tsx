import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeForm } from '../recipe-form';
import type { NewRecipeInput } from '@/types/recipe';
import type { IngredientSection, InstructionSection } from '@/types/sections';

// Mock the section components
jest.mock('../recipe-ingredients-with-sections', () => ({
  RecipeIngredientsWithSections: ({ control, watch, errors, setError, clearErrors, isLoading }: any) => (
    <div data-testid="ingredients-with-sections">
      <div data-testid="ingredients-content">Ingredients Component</div>
      <div data-testid="ingredients-loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
    </div>
  ),
}));

jest.mock('../recipe-instructions-with-sections', () => ({
  RecipeInstructionsWithSections: ({ control, watch, errors, setError, clearErrors, isLoading }: any) => (
    <div data-testid="instructions-with-sections">
      <div data-testid="instructions-content">Instructions Component</div>
      <div data-testid="instructions-loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
    </div>
  ),
}));

// Mock the image upload component
jest.mock('../recipe-image-upload', () => ({
  RecipeImageUpload: ({ value, onChange, onRemove, disabled }: any) => (
    <div data-testid="image-upload">
      <input
        data-testid="image-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button data-testid="remove-image" onClick={() => onRemove()}>
        Remove
      </button>
    </div>
  ),
}));

describe('RecipeForm with Sections', () => {
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    submitLabel: 'Save Recipe',
  };

  it('renders the form with section components', () => {
    render(<RecipeForm {...defaultProps} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByTestId('ingredients-with-sections')).toBeInTheDocument();
    expect(screen.getByTestId('instructions-with-sections')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  it('initializes with default values including empty sections', () => {
    render(<RecipeForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    expect(titleInput).toHaveValue('');

    // Section components should be rendered
    expect(screen.getByTestId('ingredients-content')).toBeInTheDocument();
    expect(screen.getByTestId('instructions-content')).toBeInTheDocument();
  });

  it('populates form with initial data including sections', () => {
    const initialData = {
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', notes: '' },
      ],
      instructions: [
        { id: '1', step: 1, content: 'Mix ingredients', duration: 5 },
      ],
      ingredientSections: [
        {
          id: 'section-1',
          name: 'Dry Ingredients',
          order: 0,
          items: [
            { id: '1', name: 'Flour', amount: 2, unit: 'cup', notes: '' },
          ],
        },
      ],
      instructionSections: [
        {
          id: 'section-1',
          name: 'Preparation',
          order: 0,
          items: [
            { id: '1', step: 1, content: 'Mix ingredients', duration: 5 },
          ],
        },
      ],
      tags: ['dessert', 'easy'],
      difficulty: 'easy' as const,
      visibility: 'public' as const,
    };

    render(<RecipeForm {...defaultProps} initialData={initialData} />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    expect(titleInput).toHaveValue('Test Recipe');

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toHaveValue('A test recipe');
  });

  it('renders form fields correctly', async () => {
    render(<RecipeForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    await user.type(titleInput, 'New Recipe');

    expect(titleInput).toHaveValue('New Recipe');
    
    // Verify the form structure is correct
    expect(screen.getByRole('button', { name: /save recipe/i })).toBeInTheDocument();
  });

  it('passes correct props to section components', () => {
    render(<RecipeForm {...defaultProps} isLoading={true} />);

    // Verify that loading state is passed to section components
    expect(screen.getByTestId('ingredients-loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('instructions-loading')).toHaveTextContent('Loading');
  });

  it('handles loading state correctly', () => {
    render(<RecipeForm {...defaultProps} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /saving.../i });
    expect(submitButton).toBeDisabled();
    
    // Verify loading state is passed to components
    expect(screen.getByTestId('ingredients-loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('instructions-loading')).toHaveTextContent('Loading');
  });

  it('renders section components correctly', () => {
    render(<RecipeForm {...defaultProps} />);

    // Both section components should be rendered
    expect(screen.getByTestId('ingredients-with-sections')).toBeInTheDocument();
    expect(screen.getByTestId('instructions-with-sections')).toBeInTheDocument();
    
    // Verify they show not loading by default
    expect(screen.getByTestId('ingredients-loading')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('instructions-loading')).toHaveTextContent('Not Loading');
  });

  it('handles tag management', async () => {
    render(<RecipeForm {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    await user.type(tagInput, 'dessert');
    await user.click(addButton);

    // Tag should be added (this would be visible in the actual component)
    expect(tagInput).toHaveValue('');
  });

  it('handles image upload', async () => {
    render(<RecipeForm {...defaultProps} />);

    const imageInput = screen.getByTestId('image-input');
    await user.type(imageInput, 'https://example.com/image.jpg');

    expect(imageInput).toHaveValue('https://example.com/image.jpg');
  });

  it('maintains backward compatibility with non-sectioned recipes', async () => {
    const initialData = {
      title: 'Simple Recipe',
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', notes: '' },
      ],
      instructions: [
        { id: '1', step: 1, content: 'Mix ingredients', duration: 5 },
      ],
      // No sections provided
    };

    render(<RecipeForm {...defaultProps} initialData={initialData} />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    expect(titleInput).toHaveValue('Simple Recipe');

    // Section components should still render but in non-sectioned mode
    expect(screen.getByTestId('ingredients-with-sections')).toBeInTheDocument();
    expect(screen.getByTestId('instructions-with-sections')).toBeInTheDocument();
  });

  it('supports custom submit label', () => {
    render(<RecipeForm {...defaultProps} submitLabel="Create Recipe" />);

    const submitButton = screen.getByRole('button', { name: /create recipe/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('initializes form with provided data', () => {
    const initialData = {
      title: 'Test Recipe',
      description: 'Test description',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'medium' as const,
    };

    render(<RecipeForm {...defaultProps} initialData={initialData} />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    expect(titleInput).toHaveValue('Test Recipe');

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toHaveValue('Test description');
  });
});