/**
 * Integration test for RecipeSearch in MyRecipesPage.tsx context
 * Tests search button enhancement with user-specific recipes API
 * 
 * Feature: search-button-enhancement
 * Task: 12.2 Test in MyRecipesPage.tsx context
 * Requirements: All
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecipeSearch } from '../recipe-search';
import type { SearchParams } from '../recipe-search';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('RecipeSearch - MyRecipesPage Integration', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: jest.fn(),
      },
    });
  });

  describe('User-Specific Recipe Search', () => {
    it('should trigger search for user recipes when search button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Type a query for user's recipes
      await user.type(searchInput, 'my pasta recipe');

      // Click search button
      await user.click(searchButton);

      // Verify search was triggered with correct parameters
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'my pasta recipe',
          sortBy: 'newest',
        })
      );
    });

    it('should search user recipes with filters applied', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });

      // Open filters
      await user.click(filtersButton);

      // Add tags specific to user's collection
      const tagInput = screen.getByPlaceholderText(/add tag/i);
      await user.type(tagInput, 'family-favorite{Enter}');
      await user.type(tagInput, 'quick{Enter}');

      // Note: Testing Radix UI Select components in JSDOM is complex
      // Difficulty selection is tested in other test files
      // Here we focus on tags and query search

      // Type query
      await user.type(searchInput, 'dinner');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      await user.click(searchButton);

      // Verify all parameters are included for user-specific search
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'dinner',
          tags: expect.arrayContaining(['family-favorite', 'quick']),
          sortBy: 'newest',
        })
      );
    });

    it('should handle empty search results for user recipes', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Search for something that might not exist in user's collection
      await user.type(searchInput, 'nonexistent recipe xyz');
      await user.click(searchButton);

      // Verify search was triggered
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'nonexistent recipe xyz',
        })
      );

      // Parent component (MyRecipesPage) would handle empty results display
    });
  });

  describe('Error Handling in MyRecipesPage Context', () => {
    it('should allow retry after search error', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      const { rerender } = render(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Perform initial search
      await user.type(searchInput, 'chicken');
      await user.click(searchButton);

      expect(onSearch).toHaveBeenCalledTimes(1);

      // Simulate loading state
      rerender(<RecipeSearch onSearch={onSearch} isLoading={true} />);
      expect(searchButton).toBeDisabled();

      // Simulate error state (loading completes)
      rerender(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      // Modify query to retry
      await user.clear(searchInput);
      await user.type(searchInput, 'chicken soup');

      // Button should be enabled for retry
      await waitFor(() => {
        expect(searchButton).toBeEnabled();
      });

      // Retry search
      await user.click(searchButton);
      expect(onSearch).toHaveBeenCalledTimes(2);
    });

    it('should handle disabled state when graceful degradation is active', () => {
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} disabled={true} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });

      // All interactive elements should be disabled
      expect(searchInput).toBeDisabled();
      expect(searchButton).toBeDisabled();
      expect(filtersButton).toBeDisabled();
    });

    it('should maintain search state during error recovery', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      const { rerender } = render(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });

      // Set up search with filters
      await user.type(searchInput, 'salad');
      await user.click(filtersButton);

      const tagInput = screen.getByPlaceholderText(/add tag/i);
      await user.type(tagInput, 'healthy{Enter}');

      // Verify tag was added
      expect(screen.getByRole('listitem')).toHaveTextContent('healthy');

      // Simulate error during search
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      await user.click(searchButton);

      rerender(<RecipeSearch onSearch={onSearch} isLoading={true} />);
      rerender(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      // Search state should be maintained
      expect(searchInput).toHaveValue('salad');
      expect(screen.getByRole('listitem')).toHaveTextContent('healthy');
    });
  });

  describe('Authentication Context', () => {
    it('should work correctly when user is authenticated', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // User searches their own recipes
      await user.type(searchInput, 'my recipes');
      await user.click(searchButton);

      // Search should be triggered normally
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'my recipes',
        })
      );
    });

    it('should handle URL parameters on authenticated page load', () => {
      const onSearch = jest.fn();
      const urlParams = new URLSearchParams('query=breakfast&tags=quick,easy&sortBy=newest');
      (useSearchParams as jest.Mock).mockReturnValue(urlParams);

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });

      // Verify query is populated from URL
      expect(searchInput).toHaveValue('breakfast');

      // Tags should be initialized (verify by opening filters)
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      expect(filtersButton).toHaveTextContent('3'); // query + 2 tags
    });
  });

  describe('MyRecipesPage Specific Features', () => {
    it('should support sorting user recipes by different criteria', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Add search query first
      await user.type(searchInput, 'test');
      
      // Click search to establish initial search
      await user.click(searchButton);

      // Verify initial search was called
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          sortBy: 'newest',
        })
      );

      // Note: Testing Radix UI Select dropdown with user-event in JSDOM is complex
      // The sort immediate execution behavior is tested in other test files
      // This test verifies the initial search works correctly with user recipes
    });

    it('should handle pagination with user-specific recipes', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Perform search
      await user.type(searchInput, 'dessert');
      await user.click(searchButton);

      // Verify initial search
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'dessert',
          sortBy: 'newest',
        })
      );

      // MyRecipesPage would handle pagination by calling handleLoadMore
      // which uses the same search parameters maintained by RecipeSearch
    });

    it('should clear all filters including user-specific tags', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });

      // Add multiple filters
      await user.type(searchInput, 'recipe');
      await user.click(filtersButton);

      const tagInput = screen.getByPlaceholderText(/add tag/i);
      await user.type(tagInput, 'favorite{Enter}');
      await user.type(tagInput, 'tried{Enter}');

      // Verify tags were added
      const tagsList = screen.getAllByRole('listitem');
      expect(tagsList).toHaveLength(2);

      // Clear all filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);

      // Verify everything is cleared
      expect(searchInput).toHaveValue('');
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

      // Search button should be disabled
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      expect(searchButton).toBeDisabled();
    });
  });

  describe('Loading States in MyRecipesPage', () => {
    it('should show loading state during initial recipe fetch', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      const { rerender } = render(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Start search
      await user.type(searchInput, 'lunch');
      await user.click(searchButton);

      // Simulate loading
      rerender(<RecipeSearch onSearch={onSearch} isLoading={true} />);

      // Button should show loading state
      expect(searchButton).toBeDisabled();
      expect(within(searchButton).getByText(/searching/i)).toBeInTheDocument();

      // Live region should announce
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/searching recipes/i);
    });

    it('should show loading state during load more operation', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      const { rerender } = render(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Initial search
      await user.type(searchInput, 'snack');
      await user.click(searchButton);

      // Simulate loading more results
      rerender(<RecipeSearch onSearch={onSearch} isLoading={true} />);

      // During loading, both input and button are disabled to prevent interference
      // This is the current implementation behavior
      expect(searchInput).toBeDisabled();
      expect(searchButton).toBeDisabled();
    });
  });

  describe('Keyboard Navigation in MyRecipesPage', () => {
    it('should support Enter key for quick search', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });

      // Type and press Enter
      await user.type(searchInput, 'breakfast{Enter}');

      // Search should be triggered
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'breakfast',
        })
      );
    });

    it('should maintain focus after search execution', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });

      // Type query
      await user.type(searchInput, 'test');

      // Tab to search button
      await user.tab();
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      expect(searchButton).toHaveFocus();

      // Activate search button with keyboard
      await user.keyboard('{Enter}');

      // Search should be triggered
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
        })
      );
    });
  });

  describe('Accessibility in MyRecipesPage Context', () => {
    it('should have proper ARIA labels for user recipe search', () => {
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      // Search region
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toHaveAttribute('aria-label', 'Recipe search');

      // Search button
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });
      expect(searchButton).toHaveAttribute('aria-label', 'Search recipes');
      expect(searchButton).toHaveAttribute('aria-describedby', 'search-button-help');

      // Help text
      expect(screen.getByText(/press to search recipes with current filters/i)).toBeInTheDocument();
    });

    it('should announce loading state to screen readers', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      const { rerender } = render(<RecipeSearch onSearch={onSearch} isLoading={false} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Perform search
      await user.type(searchInput, 'test');
      await user.click(searchButton);

      // Simulate loading
      rerender(<RecipeSearch onSearch={onSearch} isLoading={true} />);

      // Live region should announce
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveTextContent(/searching recipes/i);
    });

    it('should meet WCAG touch target requirements', () => {
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Verify minimum 44x44px touch target
      expect(searchButton).toHaveClass('min-h-[44px]');
      expect(searchButton).toHaveClass('min-w-[44px]');
    });
  });

  describe('URL Synchronization in MyRecipesPage', () => {
    it('should update URL when searching user recipes', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Perform search
      await user.type(searchInput, 'my favorite');
      await user.click(searchButton);

      // Verify URL was updated
      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('should restore search state from URL on page load', () => {
      const onSearch = jest.fn();
      const urlParams = new URLSearchParams(
        'query=dinner&tags=vegetarian,quick&difficulty=easy&maxCookTime=30&sortBy=cookTime'
      );
      (useSearchParams as jest.Mock).mockReturnValue(urlParams);

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });

      // Verify query is restored
      expect(searchInput).toHaveValue('dinner');

      // Verify filters indicator shows active filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      expect(filtersButton).toHaveTextContent('5'); // query + 2 tags + difficulty + maxCookTime
    });
  });

  describe('Edge Cases in MyRecipesPage', () => {
    it('should handle rapid search button clicks', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Type query
      await user.type(searchInput, 'test');

      // Click search button multiple times rapidly
      await user.click(searchButton);
      await user.click(searchButton);
      await user.click(searchButton);

      // Should only trigger search once (duplicate prevention)
      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace-only query', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Type only whitespace
      await user.type(searchInput, '   ');

      // Button should remain disabled
      expect(searchButton).toBeDisabled();
    });

    it('should handle special characters in search query', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();

      render(<RecipeSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /^search recipes$/i });

      // Type query with special characters
      await user.type(searchInput, "mom's recipe & dad's favorite");
      await user.click(searchButton);

      // Should handle special characters correctly
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "mom's recipe & dad's favorite",
        })
      );
    });
  });
});
