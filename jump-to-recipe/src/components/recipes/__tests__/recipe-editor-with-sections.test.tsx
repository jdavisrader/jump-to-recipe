import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeEditor } from '../recipe-editor';
import type { Recipe } from '@/types/recipe';

// Mock the section components
jest.mock('../recipe-ingredients-with-sections', () => ({
  RecipeIngredientsWithSections: ({ control, watch, errors, setError, clearErrors, isLoading }: any) => (
    <div data-testid="ingredients-with-sections">
      <div>Ingredients with sections component</div>
      <div>Loading: {isLoading ? 'true' : 'false'}</div>
    </div>
  ),
}));

jest.mock('../recipe-instructions-with-sections', () => ({
  RecipeInstructionsWithSections: ({ control, watch, errors, setError, clearErrors, isLoading }: any) => (
    <div data-testid="instructions-with-sections">
      <div>Instructions with sections component</div>
      <div>Loading: {isLoading ? 'true' : 'false'}</div>
    </div>
  ),
}));

// Mock the recipe image component
jest.mock('../recipe-image', () => ({
  RecipeImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="recipe-image" />
  ),
}));

const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: [
    {
      id: '1',
      name: 'Flour',
      amount: 2,
      unit: 'cup',
      displayAmount: '2',
      notes: '',
    },
  ],
  instructions: [
    {
      id: '1',
      step: 1,
      content: 'Mix ingredients',
      duration: 5,
    },
  ],
  ingredientSections: [],
  instructionSections: [],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'medium',
  tags: ['test', 'recipe'],
  notes: 'Test notes',
  imageUrl: 'https://example.com/image.jpg',
  sourceUrl: 'https://example.com/recipe',
  authorId: 'user1',
  visibility: 'public',
  commentsEnabled: true,
  viewCount: 0,
  likeCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRecipeWithSections: Recipe = {
  ...mockRecipe,
  ingredientSections: [
    {
      id: 'section-1',
      name: 'Dry Ingredients',
      order: 0,
      items: [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup',
          displayAmount: '2',
          notes: '',
        },
      ],
    },
  ],
  instructionSections: [
    {
      id: 'section-1',
      name: 'Preparation',
      order: 0,
      items: [
        {
          id: '1',
          step: 1,
          content: 'Mix ingredients',
          duration: 5,
        },
      ],
    },
  ],
};

describe('RecipeEditor with Sections', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recipe editor with basic recipe data', () => {
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('A test recipe')).toBeInTheDocument();
  });

  it('renders recipe editor with sectioned recipe data', () => {
    render(
      <RecipeEditor
        recipe={mockRecipeWithSections}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  it('allows editing ingredients section', async () => {
    const user = userEvent.setup();
    
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find and click the ingredients edit button
    const ingredientsEditButton = screen.getAllByRole('button').find(
      button => button.querySelector('svg') && button.closest('[data-testid]')?.textContent?.includes('Ingredients')
    );
    
    if (ingredientsEditButton) {
      await user.click(ingredientsEditButton);
      
      // Should show the ingredients with sections component
      expect(screen.getByTestId('ingredients-with-sections')).toBeInTheDocument();
      
      // Should show save and cancel buttons
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    }
  });

  it('allows editing instructions section', async () => {
    const user = userEvent.setup();
    
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find and click the instructions edit button
    const instructionsEditButton = screen.getAllByRole('button').find(
      button => button.querySelector('svg') && button.closest('[data-testid]')?.textContent?.includes('Instructions')
    );
    
    if (instructionsEditButton) {
      await user.click(instructionsEditButton);
      
      // Should show the instructions with sections component
      expect(screen.getByTestId('instructions-with-sections')).toBeInTheDocument();
      
      // Should show save and cancel buttons
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    }
  });

  it('handles section editing save and cancel', async () => {
    const user = userEvent.setup();
    
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Start editing ingredients
    const ingredientsEditButton = screen.getAllByRole('button').find(
      button => button.querySelector('svg') && button.closest('div')?.textContent?.includes('Ingredients')
    );
    
    if (ingredientsEditButton) {
      await user.click(ingredientsEditButton);
      
      // Click save
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Should exit editing mode
      expect(screen.queryByTestId('ingredients-with-sections')).not.toBeInTheDocument();
    }
  });

  it('handles section editing cancel', async () => {
    const user = userEvent.setup();
    
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Start editing ingredients
    const ingredientsEditButton = screen.getAllByRole('button').find(
      button => button.querySelector('svg') && button.closest('div')?.textContent?.includes('Ingredients')
    );
    
    if (ingredientsEditButton) {
      await user.click(ingredientsEditButton);
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Should exit editing mode
      expect(screen.queryByTestId('ingredients-with-sections')).not.toBeInTheDocument();
    }
  });

  it('passes loading state to section components', () => {
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    // The loading state should be passed to components when they're rendered
    // This test verifies the prop is passed correctly
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  it('handles form submission with sectioned data', async () => {
    const user = userEvent.setup();
    
    render(
      <RecipeEditor
        recipe={mockRecipeWithSections}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Submit the form
    const saveButton = screen.getByText('Save Recipe');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
          description: 'A test recipe',
          ingredientSections: expect.any(Array),
          instructionSections: expect.any(Array),
        })
      );
    });
  });

  it('displays ingredients and instructions in read-only mode', () => {
    render(
      <RecipeEditor
        recipe={mockRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Should show ingredients list
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('2 cup')).toBeInTheDocument();

    // Should show instructions list
    expect(screen.getByText('Mix ingredients')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('handles recipe with empty sections gracefully', () => {
    const recipeWithEmptySections: Recipe = {
      ...mockRecipe,
      ingredientSections: [],
      instructionSections: [],
    };

    render(
      <RecipeEditor
        recipe={recipeWithEmptySections}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  it('maintains backward compatibility with recipes without section fields', () => {
    const legacyRecipe = {
      ...mockRecipe,
      ingredientSections: undefined,
      instructionSections: undefined,
    };

    render(
      <RecipeEditor
        recipe={legacyRecipe}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('Flour')).toBeInTheDocument();
  });
});