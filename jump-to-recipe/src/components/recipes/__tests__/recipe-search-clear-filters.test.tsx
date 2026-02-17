/**
 * Test: Clear filters functionality
 * Task 9.2 - Verify that clear filters button resets all state and button disabled state updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeSearch } from '../recipe-search';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('RecipeSearch - Clear Filters Functionality (Task 9.2)', () => {
  const mockOnSearch = jest.fn();
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  const mockSearchParams = {
    get: jest.fn(() => null),
  };

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

  it('should reset all filter state when clear filters button is clicked', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Add search query
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'pasta' } });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add tags
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'italian' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
    
    fireEvent.change(tagInput, { target: { value: 'vegetarian' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Set difficulty
    const difficultySelect = screen.getByLabelText('Difficulty');
    fireEvent.click(difficultySelect);
    fireEvent.click(screen.getByRole('option', { name: /^easy$/i }));

    // Set cook time
    const minCookTime = screen.getByLabelText('Minimum cook time in minutes');
    const maxCookTime = screen.getByLabelText('Maximum cook time in minutes');
    fireEvent.change(minCookTime, { target: { value: '10' } });
    fireEvent.change(maxCookTime, { target: { value: '30' } });

    // Set prep time
    const minPrepTime = screen.getByLabelText('Minimum prep time in minutes');
    const maxPrepTime = screen.getByLabelText('Maximum prep time in minutes');
    fireEvent.change(minPrepTime, { target: { value: '5' } });
    fireEvent.change(maxPrepTime, { target: { value: '15' } });

    // Verify filters are set
    expect(searchInput).toHaveValue('pasta');
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('vegetarian')).toBeInTheDocument();
    expect(difficultySelect).toHaveTextContent('Easy');
    expect(minCookTime).toHaveValue(10);
    expect(maxCookTime).toHaveValue(30);
    expect(minPrepTime).toHaveValue(5);
    expect(maxPrepTime).toHaveValue(15);

    // Click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    // Verify all filters are cleared
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
    
    // Check that the tags are removed from the selected tags list (not the popular tags)
    const selectedTags = screen.queryAllByRole('listitem');
    expect(selectedTags).toHaveLength(0);
    
    expect(difficultySelect).toHaveTextContent('Any difficulty');
    expect(minCookTime).toHaveValue(null);
    expect(maxCookTime).toHaveValue(null);
    expect(minPrepTime).toHaveValue(null);
    expect(maxPrepTime).toHaveValue(null);
  });

  it('should disable search button after clearing all filters', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Add search query
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'chicken' } });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'healthy' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Verify search button is enabled (has query and filters)
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    expect(searchButton).not.toBeDisabled();

    // Click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    // Verify search button is now disabled (no query, no filters)
    await waitFor(() => {
      expect(searchButton).toBeDisabled();
    });
  });

  it('should reset sort to newest when clearing filters', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Change sort
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.click(sortSelect);
    fireEvent.click(screen.getByRole('option', { name: /most popular/i }));

    // Verify sort changed
    await waitFor(() => {
      expect(sortSelect).toHaveTextContent('Most Popular');
    });

    // Open filters and add some
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'dessert' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    // Verify sort is reset to newest
    await waitFor(() => {
      expect(sortSelect).toHaveTextContent('Newest');
    });
  });

  it('should clear tag input field when clearing filters', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Type in tag input but don't add it
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'incomplete-tag' } });

    // Verify tag input has value
    expect(tagInput).toHaveValue('incomplete-tag');

    // Add a tag to enable clear button
    fireEvent.change(tagInput, { target: { value: 'added-tag' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Type in tag input again
    fireEvent.change(tagInput, { target: { value: 'another-incomplete' } });
    expect(tagInput).toHaveValue('another-incomplete');

    // Click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    // Verify tag input is cleared
    await waitFor(() => {
      expect(tagInput).toHaveValue('');
    });
  });

  it('should hide clear filters button when no filters are active', () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Verify clear button is not visible (no active filters)
    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
  });

  it('should show clear filters button when filters are active', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'vegan' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Verify clear button is now visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });
  });

  it('should enable search button if query exists after clearing filters', async () => {
    render(<RecipeSearch onSearch={mockOnSearch} />);

    // Add search query
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'soup' } });

    // Open filters and add some
    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'comfort-food' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Manually clear just the tag (not using clear all button)
    const removeTagButton = screen.getByRole('button', { name: /remove comfort-food tag/i });
    fireEvent.click(removeTagButton);

    // Verify search button is still enabled (query exists)
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    await waitFor(() => {
      expect(searchButton).not.toBeDisabled();
    });
  });

  it('should allow searching again after clearing filters and adding new ones', async () => {
    const { rerender } = render(<RecipeSearch onSearch={mockOnSearch} isLoading={false} />);

    // Add initial filters
    const searchInput = screen.getByPlaceholderText(/search recipes/i);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    const filtersButton = screen.getByRole('button', { name: /show advanced filters/i });
    fireEvent.click(filtersButton);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'italian' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Click search
    const searchButton = screen.getByRole('button', { name: /search recipes/i });
    fireEvent.click(searchButton);

    // Simulate loading state
    rerender(<RecipeSearch onSearch={mockOnSearch} isLoading={true} />);
    
    // Simulate loading complete
    rerender(<RecipeSearch onSearch={mockOnSearch} isLoading={false} />);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1); // First search
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    // Verify button is disabled after clear (no query, no filters)
    await waitFor(() => {
      expect(searchButton).toBeDisabled();
    });

    // Add new filters
    fireEvent.change(searchInput, { target: { value: 'salad' } });
    fireEvent.change(tagInput, { target: { value: 'healthy' } });
    fireEvent.click(screen.getByRole('button', { name: /add tag/i }));

    // Verify button is now enabled
    await waitFor(() => {
      expect(searchButton).not.toBeDisabled();
    });

    // Search again
    fireEvent.click(searchButton);

    // Verify search was called with new parameters
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(2);
    });

    const lastCall = mockOnSearch.mock.calls[1][0];
    expect(lastCall).toMatchObject({
      query: 'salad',
      tags: ['healthy'],
    });
  });
});
