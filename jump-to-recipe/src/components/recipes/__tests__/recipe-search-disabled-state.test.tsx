/**
 * Test: Search button disabled state logic
 * Task 10.2 - Verify disabled state calculation, styling, and click prevention
 * Requirements: 4.2
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock scrollIntoView for Radix UI Select component
Element.prototype.scrollIntoView = jest.fn();

describe('RecipeSearch - Disabled State Logic (Task 10.2)', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  describe('Disabled state calculation', () => {
    it('should disable button when query is empty and no filters are applied', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      expect(searchButton).toBeDisabled();
    });

    it('should enable button when query has text', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Initially disabled
      expect(searchButton).toBeDisabled();
      
      // Add query text
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      
      // Should be enabled now
      expect(searchButton).not.toBeDisabled();
    });

    it('should enable button when filters are applied (tags)', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Initially disabled
      expect(searchButton).toBeDisabled();
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);
      
      // Add a tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'vegetarian' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      
      // Button should be enabled now
      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
    });

    it('should enable button when filters are applied (difficulty)', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Initially disabled
      expect(searchButton).toBeDisabled();
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);
      
      // Set difficulty
      const difficultySelect = screen.getByLabelText('Difficulty');
      fireEvent.click(difficultySelect);
      
      const easyOption = await screen.findByText('Easy');
      fireEvent.click(easyOption);
      
      // Button should be enabled now
      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
    });

    it('should enable button when time filters are applied', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Initially disabled
      expect(searchButton).toBeDisabled();
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);
      
      // Set max cook time
      const maxCookTimeInput = screen.getByLabelText('Maximum cook time in minutes');
      fireEvent.change(maxCookTimeInput, { target: { value: '30' } });
      
      // Button should be enabled now
      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
    });

    it('should disable button during loading state', () => {
      render(<RecipeSearch onSearch={mockOnSearch} isLoading={true} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      expect(searchButton).toBeDisabled();
    });

    it('should disable button when disabled prop is true', () => {
      render(<RecipeSearch onSearch={mockOnSearch} disabled={true} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add query to verify disabled prop takes precedence
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      
      // Should still be disabled due to disabled prop
      expect(searchButton).toBeDisabled();
    });
  });

  describe('Disabled styling and cursor', () => {
    it('should apply disabled attribute when button is disabled', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Verify disabled attribute is present
      expect(searchButton).toHaveAttribute('disabled');
    });

    it('should not have disabled attribute when button is enabled', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add query
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      
      // Verify disabled attribute is not present
      expect(searchButton).not.toHaveAttribute('disabled');
    });
  });

  describe('Click event prevention when disabled', () => {
    it('should not trigger search when button is disabled and clicked', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Verify button is disabled
      expect(searchButton).toBeDisabled();
      
      // Try to click the disabled button
      fireEvent.click(searchButton);
      
      // Verify onSearch was not called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should not trigger search when Enter is pressed with empty query and no filters', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Verify button is disabled
      expect(searchButton).toBeDisabled();
      
      // Try to press Enter in the search input
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      // Verify onSearch was not called
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should trigger search when button is enabled and clicked', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add query to enable button
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      
      // Verify button is enabled
      expect(searchButton).not.toBeDisabled();
      
      // Click the button
      fireEvent.click(searchButton);
      
      // Verify onSearch was called
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'pasta',
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should disable button when query contains only whitespace', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add whitespace-only query
      fireEvent.change(searchInput, { target: { value: '   ' } });
      
      // Button should still be disabled (query.trim() is empty)
      expect(searchButton).toBeDisabled();
    });

    it('should enable button when query has text after whitespace', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add query with leading/trailing whitespace
      fireEvent.change(searchInput, { target: { value: '  pasta  ' } });
      
      // Button should be enabled (query.trim() is not empty)
      expect(searchButton).not.toBeDisabled();
    });

    it('should re-disable button when query is cleared', () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search recipes/i });
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Add query
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      expect(searchButton).not.toBeDisabled();
      
      // Clear query
      fireEvent.change(searchInput, { target: { value: '' } });
      
      // Button should be disabled again
      expect(searchButton).toBeDisabled();
    });

    it('should re-disable button when all filters are cleared', async () => {
      render(<RecipeSearch onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search recipes/i });
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
      fireEvent.click(filtersButton);
      
      // Add a tag
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'vegetarian' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      
      // Button should be enabled
      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
      
      // Clear all filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);
      
      // Button should be disabled again
      await waitFor(() => {
        expect(searchButton).toBeDisabled();
      });
    });
  });
});
