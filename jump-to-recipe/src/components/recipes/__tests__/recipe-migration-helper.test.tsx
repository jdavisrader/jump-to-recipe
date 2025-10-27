import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeMigrationHelper, RecipeRevertHelper } from '../recipe-migration-helper';
import { Recipe } from '@/types/recipe';
import { RecipeWithSections } from '@/types/sections';

// Mock the migration utilities
jest.mock('../../../lib/recipe-migration', () => ({
  RecipeMigrationUtils: {
    needsMigration: jest.fn(),
    createMigrationPreview: jest.fn(),
    validateMigration: jest.fn()
  },
  RecipeConversionUtils: {
    isConversionRecommended: jest.fn(),
    getConversionBenefits: jest.fn(),
    convertToSections: jest.fn(),
    convertToFlat: jest.fn()
  }
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
      unit: 'cup'
    },
    {
      id: '2',
      name: 'Sugar',
      amount: 1,
      unit: 'cup'
    }
  ],
  instructions: [
    {
      id: '1',
      step: 1,
      content: 'Mix ingredients'
    },
    {
      id: '2',
      step: 2,
      content: 'Bake for 30 minutes'
    }
  ],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'easy',
  tags: [],
  notes: null,
  imageUrl: null,
  sourceUrl: null,
  authorId: 'user-1',
  visibility: 'public',
  commentsEnabled: true,
  viewCount: 0,
  likeCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSectionedRecipe: RecipeWithSections = {
  ingredients: [],
  instructions: [],
  ingredientSections: [{
    id: 'section-1',
    name: 'Ingredients',
    order: 0,
    items: mockRecipe.ingredients
  }],
  instructionSections: [{
    id: 'section-2',
    name: 'Instructions',
    order: 0,
    items: mockRecipe.instructions
  }]
};

describe('RecipeMigrationHelper', () => {
  const mockMigrationUtils = require('../../../lib/recipe-migration').RecipeMigrationUtils;
  const mockConversionUtils = require('../../../lib/recipe-migration').RecipeConversionUtils;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockMigrationUtils.needsMigration.mockReturnValue(true);
    mockMigrationUtils.createMigrationPreview.mockReturnValue({
      original: {
        ingredientCount: 2,
        instructionCount: 2,
        hasSections: false
      },
      migrated: {
        ingredientSectionCount: 1,
        instructionSectionCount: 1,
        totalIngredients: 2,
        totalInstructions: 2
      }
    });
    mockMigrationUtils.validateMigration.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    mockConversionUtils.isConversionRecommended.mockReturnValue(false);
    mockConversionUtils.getConversionBenefits.mockReturnValue([
      'Better organization for meal prep and cooking',
      'Easier to follow step-by-step process'
    ]);
    mockConversionUtils.convertToSections.mockReturnValue(mockSectionedRecipe);
  });

  it('should not render when recipe does not need migration', () => {
    mockMigrationUtils.needsMigration.mockReturnValue(false);

    const { container } = render(
      <RecipeMigrationHelper recipe={mockRecipe} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render migration helper for recipes that need migration', () => {
    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    expect(screen.getByText('Recipe Organization')).toBeInTheDocument();
    expect(screen.getByText('Organize your recipe into sections for better clarity and easier cooking.')).toBeInTheDocument();
    expect(screen.getByText('Convert to Sections')).toBeInTheDocument();
  });

  it('should show recommended badge for recommended recipes', () => {
    mockConversionUtils.isConversionRecommended.mockReturnValue(true);

    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('should display conversion benefits', () => {
    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    expect(screen.getByText('Better organization for meal prep and cooking')).toBeInTheDocument();
    expect(screen.getByText('Easier to follow step-by-step process')).toBeInTheDocument();
  });

  it('should show preview when preview button is clicked', () => {
    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Preview of changes:')).toBeInTheDocument();
    expect(screen.getByText('2 ingredients')).toBeInTheDocument();
    expect(screen.getByText('2 instructions')).toBeInTheDocument();
    expect(screen.getByText('No sections')).toBeInTheDocument();
    expect(screen.getByText('2 ingredients in 1 section(s)')).toBeInTheDocument();
    expect(screen.getByText('2 instructions in 1 section(s)')).toBeInTheDocument();
  });

  it('should hide preview when hide preview button is clicked', () => {
    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Preview of changes:')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide Preview');
    fireEvent.click(hideButton);

    expect(screen.queryByText('Preview of changes:')).not.toBeInTheDocument();
  });

  it('should call onConvert when convert button is clicked', async () => {
    const mockOnConvert = jest.fn();
    render(<RecipeMigrationHelper recipe={mockRecipe} onConvert={mockOnConvert} />);

    const convertButton = screen.getByText('Convert to Sections');
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(mockConversionUtils.convertToSections).toHaveBeenCalledWith(mockRecipe);
      expect(mockMigrationUtils.validateMigration).toHaveBeenCalled();
      expect(mockOnConvert).toHaveBeenCalledWith(mockSectionedRecipe);
    });
  });

  it('should call onConvert when convert button is clicked and handle async state', async () => {
    const mockOnConvert = jest.fn();
    render(<RecipeMigrationHelper recipe={mockRecipe} onConvert={mockOnConvert} />);

    const convertButton = screen.getByText('Convert to Sections');
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(mockOnConvert).toHaveBeenCalled();
    });
  });

  it('should not call onConvert when validation fails', async () => {
    const mockOnConvert = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockMigrationUtils.validateMigration.mockReturnValue({
      isValid: false,
      errors: ['Test error'],
      warnings: []
    });

    render(<RecipeMigrationHelper recipe={mockRecipe} onConvert={mockOnConvert} />);

    const convertButton = screen.getByText('Convert to Sections');
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(mockOnConvert).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Migration validation failed:', ['Test error']);
    });

    consoleSpy.mockRestore();
  });

  it('should handle conversion errors gracefully', async () => {
    const mockOnConvert = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockConversionUtils.convertToSections.mockImplementation(() => {
      throw new Error('Test error');
    });

    render(<RecipeMigrationHelper recipe={mockRecipe} onConvert={mockOnConvert} />);

    const convertButton = screen.getByText('Convert to Sections');
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(mockOnConvert).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error converting recipe:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should show warning for complex recipes', () => {
    mockMigrationUtils.createMigrationPreview.mockReturnValue({
      original: {
        ingredientCount: 20, // Complex recipe
        instructionCount: 15,
        hasSections: false
      },
      migrated: {
        ingredientSectionCount: 1,
        instructionSectionCount: 1,
        totalIngredients: 20,
        totalInstructions: 15
      }
    });

    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    expect(screen.getByText('Complex Recipe Detected')).toBeInTheDocument();
    expect(screen.getByText('This recipe has many ingredients or steps. Converting to sections will make it much easier to follow.')).toBeInTheDocument();
  });

  it('should disable convert button when onConvert is not provided', () => {
    render(<RecipeMigrationHelper recipe={mockRecipe} />);

    const convertButton = screen.getByText('Convert to Sections');
    expect(convertButton).toBeDisabled();
  });
});

describe('RecipeRevertHelper', () => {
  const mockConversionUtils = require('../../../lib/recipe-migration').RecipeConversionUtils;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConversionUtils.convertToFlat.mockReturnValue(mockRecipe);
  });

  it('should not render when recipe has no sections', () => {
    const recipeWithoutSections: RecipeWithSections = {
      ingredients: mockRecipe.ingredients,
      instructions: mockRecipe.instructions
    };

    const { container } = render(
      <RecipeRevertHelper recipe={recipeWithoutSections} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render revert helper for recipes with sections', () => {
    render(<RecipeRevertHelper recipe={mockSectionedRecipe} />);

    expect(screen.getByRole('heading', { name: 'Remove Sections' })).toBeInTheDocument();
    expect(screen.getByText('Convert back to a simple list format without sections.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove Sections/ })).toBeInTheDocument();
  });

  it('should call onRevert when revert button is clicked', async () => {
    const mockOnRevert = jest.fn();
    render(<RecipeRevertHelper recipe={mockSectionedRecipe} onRevert={mockOnRevert} />);

    const revertButton = screen.getByRole('button', { name: /Remove Sections/ });
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(mockConversionUtils.convertToFlat).toHaveBeenCalledWith(mockSectionedRecipe);
      expect(mockOnRevert).toHaveBeenCalledWith(mockRecipe);
    });
  });

  it('should call onRevert when revert button is clicked and handle async state', async () => {
    const mockOnRevert = jest.fn();
    render(<RecipeRevertHelper recipe={mockSectionedRecipe} onRevert={mockOnRevert} />);

    const revertButton = screen.getByRole('button', { name: /Remove Sections/ });
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(mockOnRevert).toHaveBeenCalled();
    });
  });

  it('should handle revert errors gracefully', async () => {
    const mockOnRevert = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockConversionUtils.convertToFlat.mockImplementation(() => {
      throw new Error('Test error');
    });

    render(<RecipeRevertHelper recipe={mockSectionedRecipe} onRevert={mockOnRevert} />);

    const revertButton = screen.getByRole('button', { name: /Remove Sections/ });
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(mockOnRevert).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error reverting recipe:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should disable revert button when onRevert is not provided', () => {
    render(<RecipeRevertHelper recipe={mockSectionedRecipe} />);

    const revertButton = screen.getByRole('button', { name: /Remove Sections/ });
    expect(revertButton).toBeDisabled();
  });

  it('should show helper text about reverting', () => {
    render(<RecipeRevertHelper recipe={mockSectionedRecipe} />);

    expect(screen.getByText('This will combine all sections into simple lists. You can always add sections back later.')).toBeInTheDocument();
  });
});