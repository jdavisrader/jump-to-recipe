import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RecipeDisplay } from '../recipe-display';
import { useSession } from 'next-auth/react';
import type { Recipe } from '@/types/recipe';

// Mock next-auth
jest.mock('next-auth/react');

// Mock child components
jest.mock('../recipe-image', () => ({
  RecipeImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock('../recipe-comments', () => ({
  RecipeComments: () => <div data-testid="recipe-comments">Comments</div>,
}));

jest.mock('../add-to-cookbook-button', () => ({
  AddToCookbookButton: () => <button>Add to Cookbook</button>,
}));

jest.mock('../recipe-photos-viewer', () => ({
  RecipePhotosViewer: ({ photos }: { photos: any[] }) => (
    <div data-testid="recipe-photos-viewer">
      {photos.length} photos
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: 'A test recipe',
  imageUrl: '/test-image.jpg',
  ingredients: [
    {
      id: 'ing-1',
      name: 'Flour',
      amount: 2,
      unit: 'cup',
      displayAmount: '2',
      notes: '',
    },
  ],
  instructions: [
    {
      id: 'inst-1',
      step: 1,
      content: 'Mix ingredients',
      duration: 5,
    },
  ],
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'easy',
  tags: ['breakfast'],
  notes: 'Test notes',
  sourceUrl: 'https://example.com',
  authorId: 'user-1',
  commentsEnabled: true,
  visibility: 'public',
  createdAt: new Date(),
  updatedAt: new Date(),
  viewCount: 0,
  likeCount: 0,
};

describe('RecipeDisplay - Photo Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
  });

  describe('Photo Loading States', () => {
    it('shows loading state while fetching photos', async () => {
      // Mock fetch to delay response
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<RecipeDisplay recipe={mockRecipe} />);

      // Should show loading skeleton
      await waitFor(() => {
        expect(screen.getByText('Recipe Photos')).toBeInTheDocument();
      });

      const loadingSkeletons = document.querySelectorAll('.animate-pulse');
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it('displays photos after successful fetch', async () => {
      const mockPhotos = [
        {
          id: 'photo-1',
          recipeId: 'recipe-1',
          filePath: '/uploads/photo1.jpg',
          fileName: 'photo1.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          position: 0,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'photo-2',
          recipeId: 'recipe-1',
          filePath: '/uploads/photo2.jpg',
          fileName: 'photo2.jpg',
          fileSize: 2048,
          mimeType: 'image/jpeg',
          position: 1,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photos: mockPhotos }),
      });

      render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(screen.getByTestId('recipe-photos-viewer')).toBeInTheDocument();
      });

      expect(screen.getByText('2 photos')).toBeInTheDocument();
    });

    it('hides photo section when no photos exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photos: [] }),
      });

      render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/recipes/${mockRecipe.id}/photos`
        );
      });

      // Photo section should not be rendered
      expect(screen.queryByTestId('recipe-photos-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Photo Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching photos:',
          expect.any(Error)
        );
      });

      // Should not show photo section on error
      expect(screen.queryByTestId('recipe-photos-viewer')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('handles non-ok response gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch photos:',
          'Not Found'
        );
      });

      // Should not show photo section on error
      expect(screen.queryByTestId('recipe-photos-viewer')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Photo API Integration', () => {
    it('fetches photos with correct recipe ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photos: [] }),
      });

      render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/recipes/${mockRecipe.id}/photos`
        );
      });
    });

    it('refetches photos when recipe ID changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ photos: [] }),
      });

      const { rerender } = render(<RecipeDisplay recipe={mockRecipe} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const newRecipe = { ...mockRecipe, id: 'recipe-2' };
      rerender(<RecipeDisplay recipe={newRecipe} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(
          `/api/recipes/recipe-2/photos`
        );
      });
    });
  });
});
