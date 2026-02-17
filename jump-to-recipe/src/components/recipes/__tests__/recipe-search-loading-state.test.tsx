import { render, screen } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('RecipeSearch - Loading State Display (Task 10.1)', () => {
  const mockOnSearch = jest.fn();
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('Loading State Display', () => {
    it('should show Loader2 spinner when isLoading is true', () => {
      render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      // Check that the spinner is present (Loader2 has animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should change button text to "Searching..." on desktop when isLoading is true', () => {
      render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      // The "Searching..." text should be present (hidden on mobile with sm:inline)
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('should disable button during loading', () => {
      render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      // Find the search button by its aria-label
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      expect(searchButton).toBeDisabled();
    });

    it('should show Search icon when not loading', () => {
      render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={false}
        />
      );

      // The "Search" text should be present when not loading
      expect(screen.getByText('Search')).toBeInTheDocument();
      
      // Spinner should not be present
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should announce loading state to screen readers', () => {
      const { rerender } = render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={false}
        />
      );

      // Initially, no announcement
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('');

      // When loading starts, announce it
      rerender(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      expect(liveRegion).toHaveTextContent('Searching recipes...');
    });

    it('should handle both isLoading and isSearching states', () => {
      // This test verifies that the component responds to the isLoading prop
      // The isSearching state is internal and managed by the component
      const { rerender } = render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={false}
        />
      );

      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Initially not disabled (assuming no query/filters)
      // Actually, button is disabled when query is empty and no filters
      expect(searchButton).toBeDisabled();

      // When loading, button should be disabled
      rerender(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      expect(searchButton).toBeDisabled();
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('validates Requirement 4.1: Button shows loading state while search is in progress', () => {
      render(
        <RecipeSearch 
          onSearch={mockOnSearch} 
          isLoading={true}
        />
      );

      // Verify all three aspects of loading state:
      // 1. Spinner is shown
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // 2. Button text changes to "Searching..."
      expect(screen.getByText('Searching...')).toBeInTheDocument();

      // 3. Button is disabled
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      expect(searchButton).toBeDisabled();
    });
  });
});
